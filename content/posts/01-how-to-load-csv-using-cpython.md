---
title: "Building a CSV Reader in C with Python Integration"
date: 2023-12-19T20:08:08+05:30
draft: false
ShowToc: true
TocOpen: false
summary: "CSV (Comma-Separated Values) files are a common format for storing tabular data. In this blog post, we'll explore the process of creating a simple CSV reader in C using CPython standard library."
tags: ["python", "c", "csv", "coding"]
categories: ["random-coding"]
cover:
  image: "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=2768&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  alt: "A csv photo"
  caption: "Photo by [Mika Baumeister](https://unsplash.com/@kommumikation) on [Unsplash](https://unsplash.com/photos/white-printing-paper-with-numbers-Wpnoqo2plFA)"
  relative: true
  responsiveImages: true
---

## Introduction

CSV (Comma-Separated Values) files are a common format for storing tabular data. In this blog post, we'll explore the process of creating a CSV reader in C and integrating it with Python using the CPython API. Our goal is to develop a robust and efficient CSV reader that can handle various scenarios, including file errors and memory allocation issues.

## Prerequisites

Before diving into the code, make sure you have the following:

- Basic knowledge of the C programming language.
- A C compiler installed on your system.
- Python installed, including the Python interpreter and header files.

## Code Structure

Let's begin by defining the structure of our CSV reader module. We'll use the CPython API to create a Python extension module. Here's an overview of the main components:

### Method Definitions

We'll have a method named `read_csv_file` that takes a file path as an argument and returns a Python list of lists representing the CSV data. This method will handle errors gracefully.

```c
static PyObject *read_csv_file(PyObject *self, PyObject *args);
```

### Module Definition

We define the methods and module name in the module definition structure.

```c
static PyMethodDef customcsv_methods[] = {
    {"read_csv_file", read_csv_file, METH_VARARGS, "Read a CSV file."},
    {NULL, NULL, 0, NULL} // Sentinel
};

static struct PyModuleDef customcsvmodule = {
    PyModuleDef_HEAD_INIT,
    "customcsv", // Module name
    NULL,
    -1,
    customcsv_methods // Method definitions
};
```

### Module Initialization

Finally, we create the `customcsv` module and return it to the Python interpreter.

```c
PyMODINIT_FUNC PyInit_customcsv(void) {
    return PyModule_Create(&customcsvmodule);
}
```

## Reading CSV with Error Handling

Now, let's delve into the implementation of the `read_csv_file` method. We'll handle various error scenarios, including file not found, memory allocation failures, and decoding errors.

```c
#include <Python.h>

static PyObject *read_csv_file(PyObject *self, PyObject *args) {
    // Parse the Python arguments: a single string representing the file path
    const char *file_path;
    if (!PyArg_ParseTuple(args, "s", &file_path)) {
        PyErr_SetString(PyExc_TypeError, "Invalid argument. Expected a string.");
        return NULL;
    }

    // Open the CSV file for reading
    FILE *file = fopen(file_path, "r");
    if (!file) {
        PyErr_SetFromErrnoWithFilenameObject(PyExc_FileNotFoundError, PyUnicode_DecodeFSDefault(file_path));
        return NULL;
    }

    // Create a Python list to store the rows from the CSV file
    PyObject *result = PyList_New(0);
    if (!result) {
        PyErr_NoMemory();
        fclose(file);
        return NULL;
    }

    // Buffer to store each line read from the CSV file
    char line[4096];

    // Read each line from the CSV file
    while (fgets(line, sizeof(line), file)) {
        // Create a Python list to store the elements of the current row
        PyObject *row = PyList_New(0);
        if (!row) {
            PyErr_NoMemory();
            fclose(file);
            Py_XDECREF(result);
            return NULL;
        }

        // Tokenize the line using ',' as the delimiter
        char *token = strtok(line, ",");
        while (token != NULL) {
            // Calculate the length of the token
            size_t token_len = strlen(token);

            // Strip newline characters from the end of the token
            while (token_len > 0 && (token[token_len - 1] == '\n' || token[token_len - 1] == '\r')) {
                token[--token_len] = '\0';
            }

            // Decode the token into a Python Unicode string and append it to the row list
            PyObject *item = PyUnicode_DecodeUTF8(token, token_len, "strict");
            if (!item) {
                PyErr_SetString(PyExc_UnicodeError, "Failed to decode token");
                fclose(file);
                Py_XDECREF(result);
                Py_XDECREF(row);
                return NULL;
            }

            // Append the item to the row list
            if (PyList_Append(row, item) == -1) {
                PyErr_SetString(PyExc_RuntimeError, "Failed to append item to row");
                fclose(file);
                Py_XDECREF(result);
                Py_XDECREF(row);
                return NULL;
            }

            Py_XDECREF(item);

            // Move to the next token
            token = strtok(NULL, ",");
        }

        // Append the row list to the result list
        if (PyList_Append(result, row) == -1) {
            PyErr_SetString(PyExc_RuntimeError, "Failed to append row to result");
            fclose(file);
            Py_XDECREF(result);
            Py_XDECREF(row);
            return NULL;
        }

        Py_XDECREF(row);
    }

    // Close the CSV file
    fclose(file);

    // Return the final result, which is a Python list of lists representing the CSV data
    return result;
}
```

This implementation ensures that the CSV reader is resilient to different error conditions, providing informative error messages and handling memory allocation issues gracefully.

## Conclusion

In this blog post, we've walked through the process of creating a CSV reader in C, integrated with Python using the CPython API. The reader is equipped with robust error handling to handle various scenarios, making it a reliable tool for working with CSV files.

Feel free to experiment with the code, and explore further improvements and optimizations based on your specific use cases. The complete source code is available on [GitHub](https://github.com/Joel-hanson/custom-csv-module).
