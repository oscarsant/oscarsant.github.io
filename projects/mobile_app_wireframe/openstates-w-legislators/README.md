### build_w_legislators.js

```javascript
// Import required modules
import fetch from 'node-fetch';
import fs from 'fs';

// Your Open States API key
const API_KEY = process.env.OPENSTATES_API_KEY;
const BASE_URL = 'https://openstates.org/api/v3';

// Function to fetch all state jurisdictions
async function fetchStateJurisdictions() {
    const response = await fetch(`${BASE_URL}/jurisdictions?apikey=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch jurisdictions');
    return response.json();
}

// Function to fetch current officeholders for a given jurisdiction
async function fetchCurrentOfficeholders(jurisdiction) {
    const response = await fetch(`${BASE_URL}/jurisdictions/${jurisdiction}/officers?apikey=${API_KEY}`);
    if (!response.ok) throw new Error(`Failed to fetch officeholders for ${jurisdiction}`);
    return response.json();
}

// Main function to build the list of legislators
async function buildWLegislators() {
    try {
        const jurisdictions = await fetchStateJurisdictions();
        const legislators = [];

        for (const jurisdiction of jurisdictions) {
            const officeholders = await fetchCurrentOfficeholders(jurisdiction.id);
            const filteredLegislators = officeholders.filter(legislator => 
                legislator.full_name.toLowerCase().startsWith('w')
            );
            legislators.push(...filteredLegislators);
        }

        // Write raw array to JSON file
        fs.writeFileSync('w_state_legislators.json', JSON.stringify(legislators, null, 2));

        // Write ESM module to JS file
        const moduleContent = `export default ${JSON.stringify(legislators, null, 2)};`;
        fs.writeFileSync('w_state_legislators.js', moduleContent);

        console.log(`${legislators.length} legislators starting with W have been written to files.`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the script
buildWLegislators();
```

### Instructions to Run the Script

1. **Get a Free Open States API Key**: 
   - Sign up at [Open States API](https://docs.openstates.org/api-v3/) to get your API key.

2. **Set Up Your Environment**:
   - Make sure you have Node.js (version 18 or higher) installed.
   - Create a new directory for your project and navigate into it.
   - Run `npm init -y` to create a `package.json` file.
   - Install the `node-fetch` package by running:
     ```bash
     npm install node-fetch
     ```

3. **Create the Script**:
   - Create a file named `build_w_legislators.js` and copy the above code into it.

4. **Run the Script**:
   - Set your Open States API key in your environment:
     ```bash
     export OPENSTATES_API_KEY=YOUR_KEY
     ```
   - Run the script using Node.js:
     ```bash
     node build_w_legislators.js
     ```

After running the script, you will have two files:
- `w_state_legislators.json`: A raw array of legislators whose names start with "W".
- `w_state_legislators.js`: An ES module that exports the array for easy import.

### Example of Importing the Module

You can import the generated module in another JavaScript file like this:

```javascript
import wLegs from './w_state_legislators.js';
console.log(wLegs.length, 'legislators starting with W');
```

This will log the number of legislators whose names start with "W".