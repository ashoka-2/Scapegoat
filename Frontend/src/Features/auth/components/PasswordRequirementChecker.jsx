import React from "react";

export const checkPasswordRequirements = (password = "") => {
  return {
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    hasMinLength: password.length >= 8,
  };
};

export const isPasswordValid = (password = "") => {
  const reqs = checkPasswordRequirements(password);
  return reqs.hasUppercase && reqs.hasNumber && reqs.hasSpecialChar && reqs.hasMinLength;
};

const PasswordRequirementChecker = ({ password = "", isFocused = false }) => {
  if (!isFocused && !password) return null;

  const reqs = checkPasswordRequirements(password);

  const list = [
    { label: "At least 1 uppercase letter (A-Z)", met: reqs.hasUppercase },
    { label: "At least 1 number (0-9)", met: reqs.hasNumber },
    { label: "At least 1 special character (!@#$%^&*)", met: reqs.hasSpecialChar },
    { label: "Minimum 8 characters long", met: reqs.hasMinLength },
  ];

  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-surface border border-border-theme/60 shadow-sm space-y-1.5 text-xs select-none">
      <p className="text-[10px] font-black uppercase tracking-wider text-foreground/50 mb-1">
        Password Requirements:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {list.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
              item.met ? "text-emerald-500 font-bold" : "text-foreground/50"
            }`}
          >
            <i
              className={
                item.met
                  ? "ri-checkbox-circle-fill text-emerald-500 text-sm"
                  : "ri-checkbox-blank-circle-line text-foreground/30 text-sm"
              }
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordRequirementChecker;
