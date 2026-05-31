import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";

interface ResearchPaper {
  title: string;
  authors: string;
  venue: string;
  year: string;
  relevance: string;
  url: string;
}

export async function POST(req: NextRequest) {
  try {
    const { papers }: { papers: ResearchPaper[] } = await req.json();

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return NextResponse.json({ error: "No papers provided" }, { status: 400 });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: "Related Research Papers",
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Subtitle
            new Paragraph({
              text: "AI-Curated References for Your Research",
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              italics: true,
            }),

            // Papers
            ...papers.flatMap((paper, index) => [
              // Paper number and title
              new Paragraph({
                children: [
                  new TextRun({
                    text: `[${index + 1}] `,
                    bold: true,
                    color: "D4AF37",
                  }),
                  new TextRun({
                    text: paper.title,
                    bold: true,
                  }),
                ],
                spacing: { before: 300, after: 100 },
              }),

              // Authors
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Authors: ",
                    bold: true,
                  }),
                  new TextRun(paper.authors),
                ],
                spacing: { after: 50 },
              }),

              // Venue and Year
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Venue: ",
                    bold: true,
                  }),
                  new TextRun(`${paper.venue} (${paper.year})`),
                ],
                spacing: { after: 50 },
              }),

              // URL
              new Paragraph({
                children: [
                  new TextRun({
                    text: "URL: ",
                    bold: true,
                  }),
                  new ExternalHyperlink({
                    children: [
                      new TextRun({
                        text: paper.url,
                        style: "Hyperlink",
                        color: "0563C1",
                        underline: {},
                      }),
                    ],
                    link: paper.url,
                  }),
                ],
                spacing: { after: 50 },
              }),

              // Relevance
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Relevance: ",
                    bold: true,
                  }),
                  new TextRun(paper.relevance),
                ],
                spacing: { after: 200 },
              }),
            ]),

            // Footer note
            new Paragraph({
              text: "Note: These papers are AI-suggested references. Please verify their relevance and accuracy before citing in your work.",
              italics: true,
              spacing: { before: 600 },
              alignment: AlignmentType.CENTER,
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=research-papers.docx",
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
