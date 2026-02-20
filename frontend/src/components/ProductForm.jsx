import { useState, useEffect } from "react";
import Input from "./Input";
import Button from "./Button";

const ProductForm = ({
  onSubmit,
  initialData = {},
  buttonText = "Add Product",
}) => {
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

  const [name, setName] = useState(initialData.name || "");
  const [quantity, setQuantity] = useState(initialData.quantity || "");
  const [price, setPrice] = useState(initialData.price || "");
  const [category, setCategory] = useState(initialData.category || "");
  const [description, setDescription] = useState(initialData.description || "");
  const initialImages =
    Array.isArray(initialData.images) && initialData.images.length
      ? initialData.images
      : initialData.imageUrl
        ? [initialData.imageUrl]
        : [];
  const [images, setImages] = useState([
    initialImages[0] || "",
    initialImages[1] || "",
    initialImages[2] || "",
    initialImages[3] || "",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageErrors, setImageErrors] = useState(["", "", "", ""]);
  const [isImagesOpen, setIsImagesOpen] = useState(false);

  // Sync form when initialData changes (for edit mode)
  useEffect(() => {
    setName(initialData.name || "");
    setQuantity(initialData.quantity || "");
    setPrice(initialData.price || "");
    setCategory(initialData.category || "");
    setDescription(initialData.description || "");
    const nextInitialImages =
      Array.isArray(initialData.images) && initialData.images.length
        ? initialData.images
        : initialData.imageUrl
          ? [initialData.imageUrl]
          : [];
    setImages([
      nextInitialImages[0] || "",
      nextInitialImages[1] || "",
      nextInitialImages[2] || "",
      nextInitialImages[3] || "",
    ]);
    setImageErrors(["", "", "", ""]);
    setIsImagesOpen(false);
  }, [initialData]);

  const setImageAt = (index, value) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const setImageErrorAt = (index, message) => {
    setImageErrors((prev) => {
      const next = [...prev];
      next[index] = message;
      return next;
    });
  };

  const handlePickFile = (index) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setImageErrorAt(index, "Please select an image file");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageErrorAt(index, "Image must be less than 2MB");
      return;
    }

    setImageErrorAt(index, "");

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image/")) {
        setImageErrorAt(index, "Failed to read image");
        return;
      }
      setImageAt(index, dataUrl);
    };
    reader.onerror = () => setImageErrorAt(index, "Failed to read image");
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        quantity: Number(quantity),
        price: Number(price),
        category,
        description,
        images: images.map((u) => String(u || "").trim()).filter(Boolean),
      });
      // Reset form on successful submit if adding new product
      if (!initialData._id) {
        setName("");
        setQuantity("");
        setPrice("");
        setCategory("");
        setDescription("");
        setImages(["", "", "", ""]);
        setImageErrors(["", "", "", ""]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() && quantity && price;
  const isEditMode = Boolean(initialData && initialData._id);
  const selectedImages = images
    .map((u) => String(u || "").trim())
    .filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Basic Info */}
      <div className="space-y-4">
        <Input
          label="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            required
          />
          <Input
            label="Price (NPR)"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Electronics"
        />
      </div>

      {/* Description and Images */}
      <div className="space-y-4">
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
        />

        <div className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 p-4">
          <button
            type="button"
            onClick={() => setIsImagesOpen((v) => !v)}
            aria-expanded={isImagesOpen}
            className="w-full flex items-start justify-between gap-4 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                Images (up to 4)
              </p>
              <p className="text-xs text-slate-600 dark:text-mid-400 mt-1">
                {selectedImages.length} selected
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-mid-300">
              {isImagesOpen ? "Hide" : isEditMode ? "Edit" : "Add"}
            </span>
          </button>

          {selectedImages.length ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {images.map((src, idx) =>
                src ? (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200/70 dark:border-deep-700/70 bg-white/40 dark:bg-deep-950/10"
                  >
                    <img
                      src={src}
                      alt={`Selected ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg border border-dashed border-slate-300/70 dark:border-deep-700/70 bg-white/30 dark:bg-deep-950/10"
                  />
                ),
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-700 dark:text-mid-300">
              No images added yet.
            </p>
          )}

          {imageErrors.some(Boolean) ? (
            <p className="mt-3 text-sm text-red-600 font-medium">
              One or more images need attention. Expand the Images section to
              fix.
            </p>
          ) : null}

          {isImagesOpen && (
            <div className="mt-4 space-y-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/70 dark:border-deep-700/70 bg-white/60 dark:bg-deep-950/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                      Image {idx + 1}
                    </p>
                    {images[idx] ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImageErrorAt(idx, "");
                          setImageAt(idx, "");
                        }}
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>

                  <Input
                    label="Image link (URL)"
                    type="url"
                    value={images[idx]}
                    onChange={(e) => {
                      setImageErrorAt(idx, "");
                      setImageAt(idx, e.target.value);
                    }}
                    placeholder="https://..."
                  />

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <label className="inline-flex items-center gap-3">
                      <span className="text-sm font-semibold text-slate-900 dark:text-mid-300">
                        Upload from device (≤ 2MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePickFile(idx)}
                        className="block w-full text-sm text-slate-700 dark:text-mid-300 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
                      />
                    </label>
                  </div>

                  {imageErrors[idx] ? (
                    <p className="text-red-600 text-sm font-medium flex items-center gap-1">
                      <span>⚠️</span>
                      {imageErrors[idx]}
                    </p>
                  ) : null}

                  {images[idx] ? (
                    <div className="rounded-lg overflow-hidden border border-slate-200/70 dark:border-deep-700/70 bg-white/40 dark:bg-deep-950/10">
                      <img
                        src={images[idx]}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-28 object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!isFormValid || isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Loading...
          </span>
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
};

export default ProductForm;
