import { Alert, Slide, Snackbar } from "@mui/material";
import React from "react";
import PropTypes from "prop-types";

const Transition = (props) => {
  return <Slide {...props} direction="left" />;
};

const CustomSnackbar = (props) => {
  const { open, message, onClose, type } = props;
  const snackbarState = {
    vertical: "bottom",
    horizontal: "center",
    transition: Transition
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: snackbarState.vertical,
        horizontal: snackbarState.horizontal
      }}
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      TransitionComponent={snackbarState.transition}
      message={message}
      key={snackbarState.transition.name}
    >
      <Alert severity={type}>{message}</Alert>
    </Snackbar>
  );
};

CustomSnackbar.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  onClose: PropTypes.func,
  type: PropTypes.string
};

export default CustomSnackbar;
