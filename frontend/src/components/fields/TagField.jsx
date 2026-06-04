import React, { useEffect, useState } from "react";
import { Autocomplete, TextField, Chip } from "@mui/material";
import { fetchTags } from "../../utils/agent";

// Render a tag chip tinted with the tag's own colour at low alpha (never plain
// black/white on a colour), matching the design language.
const tagChipSx = (color) =>
  color
    ? {
        backgroundColor: `${color}33`,
        color: "#fff",
        border: `1px solid ${color}`,
      }
    : undefined;

/**
 * Free-form, create-on-type tag input shared by every wizard. Autocompletes
 * existing tags (optionally filtered to a `kind`, e.g. "subject") and lets the
 * user type a new value to create it on submit. Value is an array of
 * `{ name, color?, kind?, id? }`; new free-typed entries normalise to `{ name }`.
 *
 * Designed for a react-hook-form <Controller>: pass `value` and `onChange`.
 */
const TagField = ({
  label = "Tags",
  value = [],
  onChange,
  kind,
  hint,
  placeholder = "Add a tag…",
}) => {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    let active = true;
    fetchTags(inputValue, kind)
      .then((tags) => {
        if (active && Array.isArray(tags)) setOptions(tags);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [inputValue, kind]);

  const labelOf = (option) => (typeof option === "string" ? option : option.name);

  return (
    <Autocomplete
      multiple
      freeSolo
      options={options}
      value={value}
      filterSelectedOptions
      getOptionLabel={labelOf}
      isOptionEqualToValue={(option, val) => labelOf(option) === labelOf(val)}
      onInputChange={(_e, v) => setInputValue(v)}
      onChange={(_e, newValue) =>
        onChange(
          newValue.map((item) =>
            typeof item === "string" ? { name: item.trim() } : item
          )
        )
      }
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={labelOf(option)}
              size="small"
              sx={tagChipSx(option.color)}
              {...chipProps}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length === 0 ? placeholder : undefined}
          helperText={hint || " "}
          sx={{ mb: 1 }}
        />
      )}
    />
  );
};

export default TagField;
