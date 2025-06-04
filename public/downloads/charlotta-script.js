document.addEventListener('DOMContentLoaded', () => {
  const logoLink = document.getElementById('charlotta-logo-link');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('../index.html', '_blank', 'noopener,noreferrer,width=1280,height=800');
    });
  }


  
  const downloadLink = document.getElementById('download-zip');
  if (downloadLink) {
    downloadLink.addEventListener('click', function (e) {
      const confirmed = confirm(
        "This file is ~922 MB.\n\nAre you sure you want to download CHARLOTTA.zip?"
      );
      if (!confirmed) {
        e.preventDefault();
      }
    });
  }
});
