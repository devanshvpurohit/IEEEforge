import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export async function POST(req: NextRequest) {
  try {
    const { paper } = await req.json();

    if (!paper) {
      return NextResponse.json({ error: "No paper data provided" }, { status: 400 });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: paper.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            
            // Abstract
            new Paragraph({
              text: "Abstract",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: paper.abstract,
                  italics: true,
                }),
              ],
            }),

            // Keywords
            new Paragraph({
              children: [
                new TextRun({
                  text: "Keywords—",
                  bold: true,
                }),
                new TextRun(paper.keywords.join(", ")),
              ],
              spacing: { before: 200 },
            }),

            // Sections
            ...paper.sections.flatMap((section: any) => [
              new Paragraph({
                text: section.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400 },
              }),
              new Paragraph({
                text: section.content,
              }),
            ]),

            // References
            new Paragraph({
              text: "References",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            ...paper.references.map((ref: string, i: number) => 
              new Paragraph({
                text: `[${i + 1}] ${ref}`,
              })
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=ieee_paper.docx",
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
