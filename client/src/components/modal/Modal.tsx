import React, { useState } from "react";
import { Modal } from "./Modal"; 
import { Input } from "../input/Input";


interface PersonalInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function PersonalInfoModal({ open, onClose }: PersonalInfoModalProps) {
  // State to hold the form data matching your reference image
  const [formData, setFormData] = useState({
    firstName: "Musharof",
    lastName: "Chowdhury",
    email: "randomuser@pimjo.com",
    phone: "+09 363 398 46",
    bio: "Team Manager",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Custom footer matching the "Close" and "Save Changes" buttons in the image
  const modalFooter = (
    <div className="flex w-full items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors outline-none focus:ring-2 focus:ring-slate-200"
      >
        Close
      </button>
      <button
        type="button"
        onClick={() => {
          console.log("Saved Data:", formData);
          onClose();
        }}
        className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
      >
        Save Changes
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="large" // Using 'large' from your SIZE_CLASSES to accommodate the 2-column layout well
      title={
        <span className="text-lg font-bold text-slate-800 dark:text-white">
          Personal Information
        </span>
      }
      footer={modalFooter}
    >
      {/* Grid container for the inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 py-4">
        
        {/* Row 1 */}
        <Input
          id="firstName"
          name="firstName"
          label={<span className="normal-case tracking-normal text-sm text-slate-800 font-medium">First Name</span>}
          value={formData.firstName}
          onChange={handleChange}
        />
        <Input
          id="lastName"
          name="lastName"
          label={<span className="normal-case tracking-normal text-sm text-slate-800 font-medium">Last Name</span>}
          value={formData.lastName}
          onChange={handleChange}
        />

        {/* Row 2 */}
        <Input
          id="email"
          name="email"
          type="email"
          label={<span className="normal-case tracking-normal text-sm text-slate-800 font-medium">Email Address</span>}
          value={formData.email}
          onChange={handleChange}
        />
        <Input
          id="phone"
          name="phone"
          type="tel"
          label={<span className="normal-case tracking-normal text-sm text-slate-800 font-medium">Phone</span>}
          value={formData.phone}
          onChange={handleChange}
        />

        {/* Row 3 (Full Width) */}
        <div className="md:col-span-2">
          <Input
            id="bio"
            name="bio"
            label={<span className="normal-case tracking-normal text-sm text-slate-800 font-medium">Bio</span>}
            value={formData.bio}
            onChange={handleChange}
          />
        </div>
        
      </div>
    </Modal>
  );
}