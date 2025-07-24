import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-center text-sm text-gray-600 py-4 border-t mt-auto">
      <div className="container mx-auto px-4">
        &copy; {new Date().getFullYear()} ERP Tools. All rights reserved.
      </div>
    </footer>
  );
};
  
export default Footer;
