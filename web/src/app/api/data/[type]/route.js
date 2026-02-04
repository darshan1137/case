import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  try {
    const { type } = await params;

    // Map data type to filename
    const fileMapping = {
      hospital: 'hospital.json',
      school: 'school_andbusttop.json',
      police: 'police_and_firestation.json',
      water: 'water_and_waste.json',
      bmc: 'bmc_data.json',
      highway: 'highway_bridge.json'
    };

    const filename = fileMapping[type];
    if (!filename) {
      return new Response(JSON.stringify({ error: 'Invalid data type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construct the path to the data file - go up one level from web to project root
    const dataPath = path.join(process.cwd(), '..', 'server', 'data', filename);

    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      return new Response(JSON.stringify({ error: 'Data file not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read the file
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Get query parameters for pagination
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 500); // Max 500 per request
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Filter out elements without coordinates
    const validElements = (data.elements || []).filter(el => el.lat && el.lon && el.tags);

    // Apply pagination
    const paginatedElements = validElements.slice(offset, offset + limit);

    // Return the data with pagination metadata
    const response = {
      type,
      total: validElements.length,
      returned: paginatedElements.length,
      offset,
      limit,
      elements: paginatedElements,
      hasMore: offset + limit < validElements.length
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error serving data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
