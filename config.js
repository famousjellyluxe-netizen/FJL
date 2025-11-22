// FJL Business Account Configuration
// This will be managed from the admin panel in the future

const fjlConfig = {
    businessAccount: {
        accountHolder: "Famous Jolly Luxe Ltd",
        bankName: "First Bank Nigeria",
        accountNumber: "2058123456",
        accountType: "Business",
        bankCode: "011"
    }
};

// Function to get business account details
function getBusinessAccount() {
    return fjlConfig.businessAccount;
}

// Function to format account for display
function formatAccountDisplay(account) {
    return `
        <div class="payment-detail-row">
            <span class="payment-detail-label">Account Holder:</span>
            <span class="payment-detail-value">${account.accountHolder}</span>
        </div>
        <div class="payment-detail-row">
            <span class="payment-detail-label">Bank Name:</span>
            <span class="payment-detail-value">${account.bankName}</span>
        </div>
        <div class="payment-detail-row">
            <span class="payment-detail-label">Account Number:</span>
            <span class="payment-detail-value">${account.accountNumber}</span>
        </div>
        <div class="payment-detail-row">
            <span class="payment-detail-label">Account Type:</span>
            <span class="payment-detail-value">${account.accountType}</span>
        </div>
    `;
}
