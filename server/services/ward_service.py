import json
import os
from typing import Optional, Tuple
from shapely.geometry import Point, Polygon

class WardService:
    """Service to determine ward based on latitude and longitude"""
    
    _instance = None
    _wards_data = None
    _ward_polygons = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WardService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Load ward mapping data"""
        if self._wards_data is None:
            self._load_ward_data()
    
    def _load_ward_data(self):
        """Load ward mapping from JSON file"""
        try:
            ward_file = os.path.join(os.path.dirname(__file__), "..", "ward_mapping.json")
            if os.path.exists(ward_file):
                with open(ward_file, 'r') as f:
                    self._wards_data = json.load(f)
                print(f"Loaded {len(self._wards_data)} wards from mapping")
            else:
                print(f"Ward mapping file not found at {ward_file}")
                self._wards_data = {}
        except Exception as e:
            print(f"Error loading ward data: {e}")
            self._wards_data = {}
    
    def get_ward_by_coordinates(self, latitude: float, longitude: float) -> Tuple[Optional[str], Optional[dict]]:
        """
        Determine ward based on latitude and longitude using bounding box.
        
        Args:
            latitude: GPS latitude coordinate
            longitude: GPS longitude coordinate
            
        Returns:
            Tuple of (ward_code, ward_data) or (None, None) if no matching ward found
        """
        if not self._wards_data:
            return None, None
        
        # Iterate through wards and check if point is within bounding box
        for ward_key, ward_info in self._wards_data.items():
            bbox = ward_info.get('bounding_box', {})
            
            # Check if coordinates are within bounding box
            if (bbox.get('south') <= latitude <= bbox.get('north') and
                bbox.get('west') <= longitude <= bbox.get('east')):
                
                # Clean up the ward code (remove newlines/whitespace)
                ward_code = ward_key.strip()
                
                return ward_code, ward_info
        
        # If no exact match, find nearest ward
        return self._find_nearest_ward(latitude, longitude)
    
    def _find_nearest_ward(self, latitude: float, longitude: float) -> Tuple[Optional[str], Optional[dict]]:
        """
        Find the nearest ward if point is not within any bounding box.
        
        Args:
            latitude: GPS latitude coordinate
            longitude: GPS longitude coordinate
            
        Returns:
            Tuple of (ward_code, ward_data)
        """
        if not self._wards_data:
            return None, None
        
        min_distance = float('inf')
        nearest_ward = None
        nearest_data = None
        
        point = Point(longitude, latitude)
        
        for ward_key, ward_info in self._wards_data.items():
            center = ward_info.get('center', {})
            center_point = Point(center['longitude'], center['latitude'])
            
            # Calculate distance
            distance = point.distance(center_point)
            
            if distance < min_distance:
                min_distance = distance
                nearest_ward = ward_key.strip()
                nearest_data = ward_info
        
        return nearest_ward, nearest_data
    
    def get_all_wards(self) -> list:
        """Get list of all ward codes"""
        if not self._wards_data:
            return []
        return [ward_key.strip() for ward_key in self._wards_data.keys()]


ward_service = WardService()
