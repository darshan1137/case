package in.codinggurus.mcase.network;

public class ApiConfig {
    
    // Change this to your computer's local IP address when testing on physical device
    // Find your IP: Windows CMD -> ipconfig (look for IPv4 Address)
    
    private static final String BASE_URL_EMULATOR = "http://10.0.2.2:3000/api/";
    private static final String BASE_URL_DEVICE = "http://192.168.1.100:3000/api/";
    
    // Set to true when testing on physical device, false for emulator
    private static final boolean USE_PHYSICAL_DEVICE = true;
    
    public static String getBaseUrl() {
        return USE_PHYSICAL_DEVICE ? BASE_URL_DEVICE : BASE_URL_EMULATOR;
    }
}
