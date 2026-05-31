import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { IEEEPaper, IEEESection } from "@/lib/paper-types";

export async function POST(req: NextRequest) {
  try {
    const { paper }: { paper: IEEEPaper } = await req.json();

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
            ...paper.sections.flatMap((section: IEEESection) => [
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

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=ieee_paper.docx",
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
