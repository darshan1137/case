import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';

export async function GET(request) {
  try {
    const q = query(collection(db, 'contractors'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const contractors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return Response.json({
      success: true,
      data: contractors,
      count: contractors.length
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { contractors } = body;

    if (!Array.isArray(contractors) || contractors.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid contractors data' },
        { status: 400 }
      );
    }

    const savedContractors = [];

    for (const contractor of contractors) {
      // Validate required fields
      if (!contractor.name || !contractor.email || !contractor.phone) {
        continue;
      }

      const contractorData = {
        name: contractor.name,
        email: contractor.email,
        phone: contractor.phone,
        company_name: contractor.company_name || '',
        registration_number: contractor.registration_number || '',
        description: contractor.description || '',
        specializations: contractor.specializations || [],
        ward_ids: contractor.ward_ids || [],
        max_concurrent_jobs: contractor.max_concurrent_jobs || 5,
        availability: contractor.availability || 'available',
        status: 'pending',
        verified: false,
        rating: 0,
        total_jobs_completed: 0,
        current_active_jobs: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      };

      const docRef = await addDoc(collection(db, 'contractors'), contractorData);
      savedContractors.push({
        id: docRef.id,
        ...contractorData
      });
    }

    return Response.json({
      success: true,
      message: `${savedContractors.length} contractor(s) added successfully`,
      data: savedContractors,
      count: savedContractors.length
    });
  } catch (error) {
    console.error('Error adding contractors:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
