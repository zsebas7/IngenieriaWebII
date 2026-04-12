window.NetoToast = {
  show(message, type = 'success', options = {}) {
    const stackId = options.stackId || 'netoToastStack';
    const leaveDelay = Number(options.leaveDelay || 2300);
    const removeDelay = Number(options.removeDelay || 230);

    let stack = document.getElementById(stackId);
    if (!stack) {
      stack = document.createElement('div');
      stack.id = stackId;
      stack.className = 'neto-toast-stack';
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = `neto-toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);

    window.setTimeout(() => {
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), removeDelay);
    }, leaveDelay);
  },
};
