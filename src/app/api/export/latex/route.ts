import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { paper } = await req.json();

    if (!paper) {
      return NextResponse.json({ error: "No paper data provided" }, { status: 400 });
    }

    const sectionsLatex = paper.sections.map((s: any) => 
      `\\section{${s.title.replace(/^[IVXLC]+\.\s*/, '')}}\n${s.content}`
    ).join("\n\n");

    const referencesLatex = paper.references.map((ref: string, i: number) => 
      `\\bibitem{ref${i+1}} ${ref}`
    ).join("\n");

    const latexTemplate = `
\\documentclass[conference]{IEEEtran}
\\usepackage{cite}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{algorithmic}
\\usepackage{graphicx}
\\usepackage{textcomp}
\\usepackage{xcolor}

\\begin{document}

\\title{${paper.title}}

\\author{\\IEEEauthorblockN{Author Name}
\\IEEEauthorblockA{\\textit{Department Name} \\\\
\\textit{University Name}\\\\
City, Country \\\\
email@address.com}}

\\maketitle

\\begin{abstract}
${paper.abstract}
\\end{abstract}

\\begin{IEEEkeywords}
${paper.keywords.join(", ")}
\\end{IEEEkeywords}

${sectionsLatex}

\\begin{thebibliography}{00}
${referencesLatex}
\\end{thebibliography}

\\end{document}
    `;

    return NextResponse.json({ latex: latexTemplate.trim() });
  } catch (error: any) {
    console.error("LaTeX export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
