(() => {
  function money(currency, value) {
    return `${currency || 'ARS'} ${Number(value || 0).toFixed(2)}`;
  }

  function ars(value) {
    return money('ARS', value);
  }

  function arsCompact(value) {
    const amount = Number(value || 0);
    const absAmount = Math.abs(amount);

    if (absAmount >= 1000 && absAmount < 1000000) {
      const inThousands = amount / 1000;
      const thousandsFormatted = inThousands.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      });
      return `ARS ${thousandsFormatted} mil`;
    }

    const defaultFormatted = amount.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `ARS ${defaultFormatted}`;
  }

  window.NetoFormat = {
    money,
    ars,
    arsCompact,
  };
})();
