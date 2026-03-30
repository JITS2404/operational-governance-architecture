// Script to check users and assign tickets to technicians
const assignTicketsToTechnician = async () => {
  try {
    console.log('Fetching users...');
    const usersResponse = await fetch('http://localhost:3002/api/users');
    const users = await usersResponse.json();
    
    console.log('All users:');
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Find technician users
    const technicians = users.filter(user => user.role === 'TECHNICIAN');
    console.log('\nTechnicians found:', technicians.length);
    
    if (technicians.length === 0) {
      console.log('No technicians found. Creating a sample technician...');
      // You would need to create a technician user in the database
      return;
    }
    
    const technician = technicians[0];
    console.log(`Using technician: ${technician.first_name} ${technician.last_name} (ID: ${technician.id})`);
    
    // Get all tickets
    const ticketsResponse = await fetch('http://localhost:3002/api/tickets');
    const tickets = await ticketsResponse.json();
    
    console.log('\nAssigning tickets to technician...');
    
    for (const ticket of tickets) {
      if (!ticket.assigned_technician_id) {
        console.log(`Assigning ticket ${ticket.ticket_number} to technician...`);
        
        // Assign technician
        const assignResponse = await fetch(`http://localhost:3002/api/tickets/${ticket.id}/assign`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technician_id: technician.id,
            assigned_by: technician.id // Using same ID for simplicity
          })
        });
        
        if (assignResponse.ok) {
          console.log(`✓ Assigned ticket ${ticket.ticket_number}`);
        } else {
          console.log(`✗ Failed to assign ticket ${ticket.ticket_number}`);
        }
      }
    }
    
    console.log('\nDone! Check the Work Progress Tracker now.');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

assignTicketsToTechnician();