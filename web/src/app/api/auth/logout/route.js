import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Clear auth tokens on client side is handled by the frontend
    // This endpoint is for any server-side cleanup if needed
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Logout failed'
    }, { status: 500 });
  }
}
