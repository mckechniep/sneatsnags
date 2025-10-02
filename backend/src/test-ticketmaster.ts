import dotenv from 'dotenv';
import { ticketmasterService } from './services/ticketmasterService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function testTicketmasterIntegration() {
  logger.info('🧪 Testing Ticketmaster API integration...');

  try {
    // Test 1: Search for events
    console.log('\n🔍 Test 1: Searching for events...');
    const searchResult = await ticketmasterService.searchEvents({
      countryCode: 'US',
      size: 5,
      classificationName: 'music',
    });

    if (searchResult && searchResult._embedded?.events) {
      console.log(`✅ Found ${searchResult._embedded.events.length} events`);
      console.log(`📊 Total events available: ${searchResult.page.totalElements}`);

      // Show first event details
      const firstEvent = searchResult._embedded.events[0];
      if (firstEvent) {
        console.log(`\n🎵 First event: ${firstEvent.name}`);
        console.log(`📅 Date: ${firstEvent.dates.start.localDate}`);
        console.log(`🏟️ Venue: ${firstEvent._embedded?.venues?.[0]?.name || 'TBD'}`);
        console.log(`🌆 City: ${firstEvent._embedded?.venues?.[0]?.city?.name || 'TBD'}`);
      }
    } else {
      console.log('❌ No events found');
    }

    // Test 2: Search by keyword
    console.log('\n🔍 Test 2: Searching for "Taylor Swift" events...');
    const keywordEvents = await ticketmasterService.searchEventsByKeyword('Taylor Swift', {
      countryCode: 'US',
      size: 3,
    });

    console.log(`✅ Found ${keywordEvents.length} Taylor Swift events`);
    keywordEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} - ${event.dates.start.localDate}`);
    });

    // Test 3: Search by city
    console.log('\n🔍 Test 3: Searching for events in New York...');
    const cityEvents = await ticketmasterService.getEventsByCity('New York', {
      countryCode: 'US',
      size: 3,
    });

    console.log(`✅ Found ${cityEvents.length} events in New York`);
    cityEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.name} - ${event.dates.start.localDate}`);
    });

    // Test 4: Transform event
    if (searchResult && searchResult._embedded?.events?.[0]) {
      console.log('\n🔄 Test 4: Testing event transformation...');
      const transformedEvent = ticketmasterService.transformEventToInternal(searchResult._embedded.events[0]);
      console.log('✅ Event transformed successfully:');
      console.log(`Name: ${transformedEvent.name}`);
      console.log(`Venue: ${transformedEvent.venue}`);
      console.log(`City: ${transformedEvent.city}`);
      console.log(`Date: ${transformedEvent.eventDate}`);
      console.log(`Category: ${transformedEvent.category}`);
      console.log(`Price Range: $${transformedEvent.minPrice} - $${transformedEvent.maxPrice}`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);

    if (error.message.includes('API key')) {
      console.log('\n💡 Make sure to:');
      console.log('1. Get a Ticketmaster API key from: https://developer.ticketmaster.com/');
      console.log('2. Add it to your .env file as: TICKETMASTER_API_KEY=your_api_key_here');
    }
  }
}

// Run the test
if (require.main === module) {
  testTicketmasterIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test script error:', error);
      process.exit(1);
    });
}

export { testTicketmasterIntegration };