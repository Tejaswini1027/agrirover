// Indian states/UTs for the location step's dropdown. District and village
// stay free-text — an exhaustive district database is out of scope for this
// project and easy to bolt on later (swap the district input for a second
// dropdown keyed by state) without touching the rest of the signup flow.
export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const FARMER_TYPES = ['Smallholder', 'Tenant Farmer', 'Landowner', 'Cooperative Member', 'Other'];

export const FARM_SIZE_RANGES = ['Less than 1 acre', '1–5 acres', '5–10 acres', '10–25 acres', 'More than 25 acres'];

export const EXPERIENCE_RANGES = ['Less than 1 year', '1–5 years', '5–10 years', '10–20 years', 'More than 20 years'];
