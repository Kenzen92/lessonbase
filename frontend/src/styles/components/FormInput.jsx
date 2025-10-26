import React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { modalStyles } from './ModalStyles';

export const FormInput = React.forwardRef(({
  type = 'text',
  options,
  label,
  ...props
}, ref) => {
  if (type === 'select') {
    return (
      <FormControl fullWidth sx={modalStyles.inputField}>
        <InputLabel>{label}</InputLabel>
        <Select
          ref={ref}
          label={label}
          sx={modalStyles.select}
          {...props}
        >
          {options?.map((option) => (
            <MenuItem 
              key={option.value} 
              value={option.value}
              sx={{
                backgroundColor: '#2A2A2A',
                '&:hover': {
                  backgroundColor: '#3A3A3A',
                },
                '&.Mui-selected': {
                  backgroundColor: '#404040',
                  '&:hover': {
                    backgroundColor: '#454545',
                  },
                },
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <TextField
      ref={ref}
      type={type}
      label={label}
      fullWidth
      variant="outlined"
      sx={modalStyles.inputField}
      {...props}
    />
  );
});