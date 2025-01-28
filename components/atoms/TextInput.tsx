import React from 'react';
import { ThemeProvider, TextField } from '@mui/material';
import theme from '@/lib/theme';

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
};

const TextInput: React.FC<TextInputProps> = ({ value, onChange }) => {
  return (
    <ThemeProvider theme={theme}>
      <TextField
        rows={20}
        multiline
        variant="outlined"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="区別する形式を入力してください。"
      />
    </ThemeProvider>
  );
}

export default TextInput;