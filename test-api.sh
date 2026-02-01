#!/bin/bash

API_URL="https://handeshamwari-transport-hande-api.vercel.app/api"

echo "=== Phase 2 API Testing ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s $API_URL
echo -e "\n"

# Test 2: Register Driver
echo "2. Testing Driver Registration..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phase2test@hande.com",
    "password": "Test1234",
    "firstName": "Phase2",
    "lastName": "Driver",
    "phone": "+263772222222",
    "userType": "driver"
  }')
echo $REGISTER_RESPONSE | jq '.'

# Extract token if registration successful
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token // empty')

if [ -n "$TOKEN" ]; then
  echo -e "\n✅ Registration successful!"
  echo "Token: ${TOKEN:0:20}..."
  
  # Test 3: Get Profile
  echo -e "\n3. Testing Get Driver Profile..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_URL/drivers/profile | jq '.'
  
  # Test 4: Subscribe Driver
  echo -e "\n4. Testing Driver Subscription..."
  curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 1.00}' \
    $API_URL/drivers/subscribe | jq '.'
  
  # Test 5: Get Subscription Status
  echo -e "\n5. Testing Get Subscription Status..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_URL/drivers/subscription | jq '.'
  
  # Test 6: Update Location
  echo -e "\n6. Testing Update Location..."
  curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "latitude": -17.8252,
      "longitude": 31.0335,
      "heading": 90,
      "speed": 45.5
    }' \
    $API_URL/drivers/location | jq '.'
  
  # Test 7: Get Driver Stats
  echo -e "\n7. Testing Get Driver Stats..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_URL/drivers/stats | jq '.'
  
  # Test 8: Add Vehicle
  echo -e "\n8. Testing Add Vehicle..."
  VEHICLE_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "color": "Silver",
      "licensePlate": "ABC-1234",
      "type": "sedan",
      "seats": 4,
      "capacity": 4
    }' \
    $API_URL/drivers/vehicles)
  echo $VEHICLE_RESPONSE | jq '.'
  
  VEHICLE_ID=$(echo $VEHICLE_RESPONSE | jq -r '.vehicle.id // empty')
  
  # Test 9: Get All Vehicles
  echo -e "\n9. Testing Get All Vehicles..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_URL/drivers/vehicles | jq '.'
  
  if [ -n "$VEHICLE_ID" ]; then
    # Test 10: Get Single Vehicle
    echo -e "\n10. Testing Get Single Vehicle..."
    curl -s -H "Authorization: Bearer $TOKEN" $API_URL/drivers/vehicles/$VEHICLE_ID | jq '.'
    
    # Test 11: Update Vehicle
    echo -e "\n11. Testing Update Vehicle..."
    curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"color": "Blue"}' \
      $API_URL/drivers/vehicles/$VEHICLE_ID | jq '.'
  fi
  
else
  echo -e "\n❌ Registration failed. Cannot proceed with authenticated tests."
fi

# Test Rider Registration
echo -e "\n12. Testing Rider Registration..."
RIDER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "phase2rider@hande.com",
    "password": "Test1234",
    "firstName": "Phase2",
    "lastName": "Rider",
    "phone": "+263773333333",
    "userType": "rider"
  }')
echo $RIDER_RESPONSE | jq '.'

RIDER_TOKEN=$(echo $RIDER_RESPONSE | jq -r '.token // empty')

if [ -n "$RIDER_TOKEN" ]; then
  echo -e "\n✅ Rider registration successful!"
  
  # Test 13: Get Rider Profile
  echo -e "\n13. Testing Get Rider Profile..."
  curl -s -H "Authorization: Bearer $RIDER_TOKEN" $API_URL/riders/profile | jq '.'
  
  # Test 14: Get Rider Stats
  echo -e "\n14. Testing Get Rider Stats..."
  curl -s -H "Authorization: Bearer $RIDER_TOKEN" $API_URL/riders/stats | jq '.'
  
  # Test 15: Get Recent Trips
  echo -e "\n15. Testing Get Recent Trips..."
  curl -s -H "Authorization: Bearer $RIDER_TOKEN" $API_URL/riders/trips | jq '.'
else
  echo -e "\n❌ Rider registration failed."
fi

echo -e "\n=== Phase 2 Testing Complete ==="
