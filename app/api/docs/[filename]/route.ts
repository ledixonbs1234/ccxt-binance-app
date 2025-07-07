import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Security: Only allow specific markdown files
    const allowedFiles = [
      'production-setup-guide.md',
      'api-keys-external-services.md',
      'monitoring-troubleshooting-guide.md'
    ];
    
    if (!allowedFiles.includes(filename)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read file from docs directory
    const filePath = join(process.cwd(), 'docs', filename);
    const content = await readFile(filePath, 'utf-8');
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
    console.error('Error reading documentation file:', error);
    
    return NextResponse.json(
      { error: 'Failed to load documentation' },
      { status: 500 }
    );
  }
}
