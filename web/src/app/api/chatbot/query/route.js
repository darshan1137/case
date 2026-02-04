import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RAG_SERVICE_URL = 'http://localhost:8002/upload-and-query';

export async function POST(request) {
  try {
    const { query } = await request.json();

    console.log('=== Chatbot API Called ===');
    console.log('Query:', query);

    if (!query || !query.trim()) {
      console.error('ERROR: Query is empty');
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Read the knowledge base file
    const knowledgeBasePath = path.join(process.cwd(), '..', 'knowledge_base.md');
    
    console.log('Knowledge base path:', knowledgeBasePath);
    console.log('File exists:', fs.existsSync(knowledgeBasePath));
    
    if (!fs.existsSync(knowledgeBasePath)) {
      console.error('ERROR: Knowledge base not found at:', knowledgeBasePath);
      return NextResponse.json({
        success: false,
        error: 'Knowledge base file not found at: ' + knowledgeBasePath
      }, { status: 500 });
    }

    const knowledgeBaseContent = fs.readFileSync(knowledgeBasePath, 'utf-8');
    console.log('Knowledge base loaded. Size:', knowledgeBaseContent.length, 'characters');

    const systemPrompt = `You are an expert AI assistant for CASE (Citizen Assistance & Service Enhancement), a municipal infrastructure management platform.

**Primary Responsibilities**:
- Guide users through platform workflows with accurate, step-by-step instructions
- Explain features, roles, and permissions based strictly on the knowledge base
- Provide troubleshooting and technical support
- Answer questions about ticket lifecycle, validation, and workflows

**Communication Standards**:
- Be precise and concise—avoid unnecessary details
- Use clear language suitable for citizens, officers, and contractors
- Provide structured answers using lists or bullet points when helpful
- Include specific page URLs or endpoints when referencing platform sections

**Answer Authority**:
- Base all responses exclusively on the knowledge base content
- If a question falls outside your knowledge base, clearly state: "This information is not covered in my knowledge base. Please contact support or check [relevant section] for details."
- Never speculate about platform behavior not documented
- For technical questions, reference the specific endpoint or component name

**Response Quality**:
- Accuracy over friendliness—prioritize correct information
- Include relevant examples or workflow steps when applicable
- For role-specific questions, tailor answers to the user's context (citizen/officer/contractor)
- Flag confidence levels if uncertain about implementation details

Reference the knowledge base strictly. Do not invent features or workflows.`;

    // Create boundary for multipart form data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    console.log('Building multipart form data with boundary:', boundary);
    
    // Build multipart form data manually
    let body = '';
    
    // Add file field
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="knowledge_base.md"\r\n`;
    body += `Content-Type: text/markdown\r\n\r\n`;
    body += knowledgeBaseContent + '\r\n';
    
    // Add query field
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="query"\r\n\r\n`;
    body += query + '\r\n';
    
    // Add system_prompt field
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="system_prompt"\r\n\r\n`;
    body += systemPrompt + '\r\n';
    
    // End boundary
    body += `--${boundary}--\r\n`;

    console.log('Form data built. Total size:', body.length, 'bytes');
    console.log('Sending request to RAG service at:', RAG_SERVICE_URL);

    // Send to RAG service
    const response = await fetch(RAG_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    console.log('RAG service responded with status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR: RAG service returned error:', errorText);
      return NextResponse.json({
        success: false,
        error: `RAG service error (${response.status}): ${errorText.substring(0, 500)}`
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('RAG service success! Result keys:', Object.keys(result));

    return NextResponse.json({
      success: true,
      answer: result.result,
      sources: result.used_sources
    });

  } catch (error) {
    console.error('=== CHATBOT API ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: `Server error: ${error.message}`
    }, { status: 500 });
  }
}
