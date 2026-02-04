import xml.etree.ElementTree as ET
import json
from typing import Dict, List, Tuple

def extract_ward_mapping(kml_file: str) -> Dict:
    """
    Extract ward names and their corresponding coordinates from KML file.
    
    Args:
        kml_file: Path to KML file
        
    Returns:
        Dictionary with ward information
    """
    # Parse KML file
    tree = ET.parse(kml_file)
    root = tree.getroot()
    
    # Define namespaces
    namespaces = {
        'kml': 'http://www.opengis.net/kml/2.2',
        'gx': 'http://www.google.com/kml/ext/2.2'
    }
    
    wards = {}
    
    # Find all Placemarks
    for placemark in root.findall('.//kml:Placemark', namespaces):
        # Get ward name
        name_elem = placemark.find('kml:name', namespaces)
        if name_elem is None:
            continue
            
        ward_name = name_elem.text
        
        # Get coordinates from Polygon
        coordinates_elem = placemark.find('.//kml:coordinates', namespaces)
        if coordinates_elem is None:
            continue
        
        coords_text = coordinates_elem.text.strip()
        if not coords_text:
            continue
        
        # Parse coordinates
        coord_pairs = coords_text.split()
        coordinates = []
        
        for coord in coord_pairs:
            parts = coord.split(',')
            if len(parts) >= 2:
                try:
                    longitude = float(parts[0])
                    latitude = float(parts[1])
                    coordinates.append({
                        "latitude": latitude,
                        "longitude": longitude
                    })
                except ValueError:
                    continue
        
        if coordinates:
            # Calculate center point (centroid)
            avg_lat = sum(c['latitude'] for c in coordinates) / len(coordinates)
            avg_lon = sum(c['longitude'] for c in coordinates) / len(coordinates)
            
            # Get bounding box
            lats = [c['latitude'] for c in coordinates]
            lons = [c['longitude'] for c in coordinates]
            
            wards[ward_name] = {
                "ward_code": ward_name,
                "center": {
                    "latitude": round(avg_lat, 6),
                    "longitude": round(avg_lon, 6)
                },
                "bounding_box": {
                    "north": round(max(lats), 6),
                    "south": round(min(lats), 6),
                    "east": round(max(lons), 6),
                    "west": round(min(lons), 6)
                },
                "coordinates_count": len(coordinates),
                "sample_coordinates": coordinates[:5]  # First 5 coordinates as sample
            }
    
    return wards

def main():
    kml_file = "d:/case/server/e7a671e2-1f71-4219-a83c-556334bc9021.kml"
    
    # Extract ward mapping
    wards = extract_ward_mapping(kml_file)
    
    # Save as JSON
    json_output = "d:/case/ward_mapping.json"
    with open(json_output, 'w') as f:
        json.dump(wards, f, indent=2)
    
    print(f"✓ Extracted {len(wards)} wards")
    print(f"✓ Saved to {json_output}")
    
    # Also create a simplified CSV-like text file
    text_output = "d:/case/ward_mapping.txt"
    with open(text_output, 'w') as f:
        f.write("Ward Code | Latitude | Longitude | North | South | East | West\n")
        f.write("-" * 80 + "\n")
        
        for ward_code in sorted(wards.keys()):
            ward = wards[ward_code]
            center = ward['center']
            bbox = ward['bounding_box']
            
            f.write(f"{ward_code:10} | {center['latitude']:9.6f} | {center['longitude']:10.6f} | ")
            f.write(f"{bbox['north']:9.6f} | {bbox['south']:9.6f} | {bbox['east']:10.6f} | {bbox['west']:10.6f}\n")
    
    print(f"✓ Saved to {text_output}")
    
    # Print summary
    print("\nWard Summary:")
    print("-" * 50)
    for ward_code in sorted(wards.keys()):
        ward = wards[ward_code]
        center = ward['center']
        print(f"{ward_code:6} → Lat: {center['latitude']:9.6f}, Lon: {center['longitude']:10.6f}")

if __name__ == "__main__":
    main()
