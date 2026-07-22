import { NextRequest, NextResponse } from 'next/server';
import { logToGoogleSheets } from '../../../lib/googleSheets';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, departments } = await req.json();

    if (!name || !email || !phone || !departments || departments.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      await logToGoogleSheets({
        name,
        email,
        phone,
        departments,
        description: "Registration via Quiz Completion" 
      });
      
    } catch (sheetsError) {
      console.error('Error logging to Google Sheets:', sheetsError);
      return NextResponse.json({ error: 'Failed to log to sheets' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Logged successfully' 
    });
  } catch (error) {
    console.error('Error in log-sheet API:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
