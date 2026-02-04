import { userService } from '../../../../lib/userService';
import { NextResponse } from 'next/server';

// POST - Deactivate user (soft delete)
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const result = await userService.deactivateUser(id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
