import { userService } from '../../../../lib/userService';
import { validators } from '../../../../lib/validation';
import { NextResponse } from 'next/server';

// GET - Get user by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const result = await userService.getUserById(id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Sanitize input data
    const sanitizedUpdates = validators.sanitizeInput(updates);
    
    // Validate update data
    const validation = validators.validateUpdateData(sanitizedUpdates);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.errors.join('; ')
      }, { status: 400 });
    }

    const result = await userService.updateUser(id, sanitizedUpdates);
    
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
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const soft = searchParams.get('soft') === 'true';

    let result;
    if (soft) {
      result = await userService.deactivateUser(id);
    } else {
      result = await userService.deleteUser(id);
    }
    
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
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
