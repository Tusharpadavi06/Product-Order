
/**
 * FRONTEND SERVICE - WEB PORTAL SIDE
 * This service sends order data to the Google Apps Script Web App.
 */
import { BRANCH_CONFIG } from '../constants';

// Target URL for your specific script (connecting to the Orders_Final sheet)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyZQABz5q9uXVgq5b5CcdBbH7t6vUy9zXTc_2jp30-3x7lMwI1AGkukVY3mZu5h9zeHEQ/exec';

export const submitToGoogleSheets = async (order: any): Promise<boolean> => {
  try {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('your_deployed_web_app_url')) {
      console.error('Configuration Error: Google Script URL is not set correctly.');
      return false;
    }

    const branchInfo = BRANCH_CONFIG[order.branch] || { headEmail: 'admin@ginzalimited.com', headName: 'Administrator' };

    // Format data for the Google Sheet "Orders_Final"
    const payload = order.items.map((item: any) => ({
      'Order No': order.id,
      'Timestamp': new Date().toLocaleString('en-IN'),
      'Customer PO': order.customerPONo || 'N/A',
      'Customer Name': order.customer?.name || 'N/A',
      'Customer Email': order.customer?.email || 'N/A',
      'Order Date': order.orderDate,
      'Production Unit': item.category, 
      'Item Name': item.itemName, // This will contain "Item Name - Grade" for ELASTIC
      'Color': item.color || 'STD',
      'Width': item.width || 'STD',
      'Unit': item.uom,
      'Qty': item.quantity,
      'Rate': item.rate,
      'Discount': item.discount || 0,
      'Delivery Date': item.dispatchDate,
      'Remark': item.remark || 'N/A',
      'Customer Contact': order.customer?.contact_no || 'N/A',
      'Billing Address': order.billingAddress || 'N/A',
      'Delivery Address': order.deliveryAddress || 'N/A',
      'Sales Person': order.salesPerson,
      'Branch': order.branch,
      'Account Status': order.accountStatus || 'Pending'
    }));

    // Send POST request
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error('Submission Error:', error);
    return false;
  }
};
