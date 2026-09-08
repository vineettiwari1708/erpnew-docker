import { useState, useEffect } from "react";
import { INDIAN_STATES, CITIES_BY_STATE } from "../utils/indianLocations";

const OTHER = "__other__";

export default function AddressFields({ address = {}, onChange, disabled = false }) {
  const cities = address.state ? (CITIES_BY_STATE[address.state] || []) : [];

  // Track whether "Other" is selected in the city dropdown
  const isOther = cities.length > 0 && address.city !== "" && !cities.includes(address.city);
  const [showOther, setShowOther] = useState(isOther);

  // When state changes, reset other-mode
  useEffect(() => { setShowOther(false); }, [address.state]);

  const base =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
    "placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
    "disabled:bg-slate-50 disabled:text-slate-400";

  const label = "block text-xs font-medium text-slate-600 mb-1";

  function handleCitySelect(e) {
    const val = e.target.value;
    if (val === OTHER) {
      setShowOther(true);
      onChange("city", "");
    } else {
      setShowOther(false);
      onChange("city", val);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Line 1 */}
      <div className="sm:col-span-2">
        <label className={label}>Address Line</label>
        <input
          type="text"
          value={address.line1 || ""}
          onChange={(e) => onChange("line1", e.target.value)}
          placeholder="Street / Building / Area"
          disabled={disabled}
          className={base}
        />
      </div>

      {/* State */}
      <div>
        <label className={label}>State</label>
        <select
          value={address.state || ""}
          onChange={(e) => {
            onChange("state", e.target.value);
            onChange("city", "");
          }}
          disabled={disabled}
          className={base}
        >
          <option value="">— Select State —</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className={label}>City</label>
        {cities.length > 0 ? (
          <div className="flex flex-col gap-2">
            <select
              value={showOther ? OTHER : (address.city || "")}
              onChange={handleCitySelect}
              disabled={disabled || !address.state}
              className={base}
            >
              <option value="">— Select City —</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value={OTHER}>Other (type manually)</option>
            </select>
            {showOther && (
              <input
                type="text"
                value={address.city || ""}
                onChange={(e) => onChange("city", e.target.value)}
                placeholder="Enter city name"
                autoFocus
                disabled={disabled}
                className={base}
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={address.city || ""}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder={address.state ? "Enter city" : "Select state first"}
            disabled={disabled || !address.state}
            className={base}
          />
        )}
      </div>

      {/* Pincode */}
      <div>
        <label className={label}>Pincode</label>
        <input
          type="text"
          value={address.pincode || ""}
          onChange={(e) => onChange("pincode", e.target.value)}
          placeholder="400001"
          maxLength={6}
          disabled={disabled}
          className={base}
        />
      </div>

      {/* Country — read-only */}
      <div>
        <label className={label}>Country</label>
        <input
          type="text"
          value="India"
          readOnly
          className={base + " cursor-default"}
        />
      </div>
    </div>
  );
}
