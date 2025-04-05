import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
   apiKey: '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'
});
export async function POST(req: NextRequest) {
  try {
    const { tagline,description,moduleList } = await req.json();
    if (!tagline && !description) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are a project manager who lists all the modules and parts of work in a project. Give output in the form of markdown file. have a detailed documentation`,
      prompt: `tagline of the project ${tagline}, feature Description : ${description} follow the module>submodules format, Modules list : ${moduleList}`,
    });
    const readmeContent = text.replace(/\\n/g, "\n");
    console.log("Generated README.md:\n", readmeContent);
    return NextResponse.json({ response: readmeContent });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
