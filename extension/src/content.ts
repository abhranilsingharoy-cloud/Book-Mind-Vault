chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "show-toast") {
    const toast = document.createElement('div');
    toast.textContent = request.message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#6C47FF';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '999999';
    toast.style.fontFamily = 'sans-serif';
    toast.style.boxShadow = '0 10px 25px rgba(108, 71, 255, 0.4)';
    toast.style.transition = 'opacity 0.3s ease-in-out';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
});
