
export const BRANCHES = [
  'Ahmedabad', 'Banglore', 'Delhi', 'Jaipur', 'Kolkata', 'Ludhiana', 'Mumbai', 'Surat', 'Tirupur', 'Ulhasnagar'
].sort();

export const CATEGORIES = [
  "CKU", "WARP", "EMB", "HOOK & EYE", "ELASTIC", "TLU", "CROCHET", "VAU", "PRINTING", "CUP"
].sort();

export const UOMS = ["Kg", "Mtr", "Pkt", "Yard", "Pcs", "Roll", "Inch"];

export const SALESMEN = [
  { name: "Amit Korgaonkar", contact: "9833181414" },
  { name: "Santosh Pachratkar", contact: "9320167523" },
  { name: "Rakesh Jain", contact: "9370672000" },
  { name: "Kamlesh Sutar", contact: "9004095847" },
  { name: "Pradeep Jadhav", contact: "8976230355" },
  { name: "Nikam", contact: "9867472660" },
  { name: "Ginza_Mumbai-HO", contact: "8805796399" }
];

export const GRADES = ["Grade I", "Grade II", "Grade III"];

// Mapping branches for background logic
export const BRANCH_CONFIG: Record<string, { headEmail: string, headName: string }> = {
  Ahmedabad: { headEmail: 'ahmedabad@ginzalimited.com', headName: 'Ravindra kaushik' },
  Banglore: { headEmail: 'murali.krishna@ginzalimited.com', headName: 'Murali Krishna' },
  Delhi: { headEmail: 'vinay.chhajer@ginzalimited.com', headName: 'Vinay Chhajer' },
  Jaipur: { headEmail: 'vishal.ambhore@ginzalimited.com', headName: 'Vishal Ambhore' }, 
  Kolkata: { headEmail: 'vishal.ambhore@ginzalimited.com', headName: 'Vishal Ambhore' },
  Ludhiana: { headEmail: 'mahesh.chandeliya@ginzalimited.com', headName: 'Mahesh' },
  Mumbai: { headEmail: 'vishal.ambhore@ginzalimited.com', headName: 'Vishal' },
  Surat: { headEmail: 'piyush.baid@ginzalimited.com', headName: 'Piyush Baid' },
  Tirupur: { headEmail: 'tirupur@ginzalimited.com', headName: 'Ravi Varman' },
  Ulhasnagar: { headEmail: 'sachin.bhosle@ginzalimited.com', headName: 'Sachin Bhosale' }
};
