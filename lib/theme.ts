import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: `-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Yu Gothic",
      Verdana, Meiryo, "M+ 1p", sans-serif`,
    allVariants: {
      color: "#484848", // Default text color
    },
  },
  palette: {
    text: {
      primary: "#484848",
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: "10px",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: "10px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: "#3b82f6",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderRadius: "2px",
          padding: "5px 30px",
          fontSize: "20px",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#3f40d5",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            fontSize: "16px",
            lineHeight: "1.5",
            fontWeight: 500,
          },
          "& .Mui-disabled": {
            background: "#e6e6e6",
            fontWeight: 700,
          },
        },
      },
    },
  },
});

export default theme;
