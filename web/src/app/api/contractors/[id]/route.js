import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const docRef = doc(db, 'contractors', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return Response.json(
        { success: false, error: 'Contractor not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    });
  } catch (error) {
    console.error('Error fetching contractor:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const docRef = doc(db, 'contractors', id);
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    await updateDoc(docRef, updateData);

    return Response.json({
      success: true,
      message: 'Contractor updated successfully',
      data: {
        id,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error updating contractor:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const docRef = doc(db, 'contractors', id);

    await deleteDoc(docRef);

    return Response.json({
      success: true,
      message: 'Contractor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contractor:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
