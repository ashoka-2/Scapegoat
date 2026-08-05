import React from "react";

/**
 * CreateProductSkeleton Component
 * Responsive skeleton matching CreateProduct.jsx form layout
 */
const CreateProductSkeleton = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-pulse">
      {/* Title */}
      <div className="space-y-2 border-b border-border-theme/40 pb-6">
        <div className="w-28 h-3.5 bg-accent/20 rounded-md" />
        <div className="w-64 h-8 bg-foreground/20 rounded-xl" />
      </div>

      {/* Form Card */}
      <div className="bg-surface border border-border-theme/60 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="w-24 h-3 bg-foreground/15 rounded-md" />
            <div className="w-full h-12 bg-background border border-border-theme/50 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="w-24 h-3 bg-foreground/15 rounded-md" />
            <div className="w-full h-12 bg-background border border-border-theme/50 rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-32 h-3 bg-foreground/15 rounded-md" />
          <div className="w-full h-28 bg-background border border-border-theme/50 rounded-xl" />
        </div>

        {/* Media Upload Placeholder Box */}
        <div className="w-full h-48 border-2 border-dashed border-border-theme/60 rounded-2xl bg-background/50 flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-foreground/10" />
          <div className="w-48 h-3.5 bg-foreground/15 rounded-md" />
        </div>

        <div className="w-40 h-12 bg-accent/40 rounded-full ml-auto" />
      </div>
    </div>
  );
};

export default CreateProductSkeleton;
