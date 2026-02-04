import { userService } from '../../../lib/userService';
import { validators } from '../../../lib/validation';
import { NextResponse } from 'next/server';

// POST - Create a new user
export async function POST(request) {
  try {
    const userData = await request.json();
    
    // Sanitize input data
    const sanitizedData = validators.sanitizeInput(userData);
    
    // Validate user data
    const validation = validators.validateUserData(sanitizedData);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.errors.join('; ')
      }, { status: 400 });
    }

    const result = await userService.createUser(sanitizedData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: result.user
      }, { status: 201 });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Get all users with pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const role = searchParams.get('role');
    const ward = searchParams.get('ward');
    const search = searchParams.get('search');

    let result;

    if (search) {
      result = await userService.searchUsers(search);
    } else if (role) {
      result = await userService.getUsersByRole(role);
    } else if (ward) {
      result = await userService.getUsersByWard(ward);
    } else {
      result = await userService.getAllUsers(limit);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        users: result.users,
        pagination: {
          hasMore: result.hasMore || false,
          limit,
          page
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
