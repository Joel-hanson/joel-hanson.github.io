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

## Python Setup and Running the Code

Now, let's go through the steps to set up your Python environment and run the CSV reader module:

A `setup.py` file is typically used in Python projects to provide metadata about the project and to specify the packaging details. For a Python extension module written in C, the `setuptools` library can be used to simplify the packaging process.

Here's a basic `setup.py` file for the CSV reader module:

```python
from setuptools import setup, Extension

# Define the extension module
customcsv_module = Extension(
    'customcsv',  # Name of the module
    sources=['customcsv.c'],  # C source file
)

# Setup information
setup(
    name='customcsv',
    version='1.0',
    description='Custom CSV reader in C with Python integration',
    ext_modules=[customcsv_module],
)
```

Save this file as `setup.py` in the same directory as your C code (`customcsv.c`). This `setup.py` file specifies the name of the extension module (`customcsv`) and the source file (`customcsv.c`). The `setuptools.setup` function is then used to provide metadata about the project.

To build and install the module, follow these steps:

1. Open a terminal and navigate to the directory containing `setup.py` and `customcsv.c`.

1. Run the following command to build the extension module:

    ```bash
    python setup.py build_ext --inplace
    ```

    This command uses `setuptools` to build the extension module and places the compiled `customcsv.so` (or `customcsv.pyd` on Windows) in the current directory.

1. After a successful build, you can import the module in Python scripts as shown in the previous example.

```python
# reader.py
import customcsv

file_path = "example.csv"  # Replace with your CSV file path
result = customcsv.read_csv_file(file_path)

print(result)
```

1. Run your Python script:

    ```bash
    python reader.py
    ```

1. System-wide Installation (Optional)
If you want to install the module system-wide, use the following command:

```bash
python setup.py install
```

After running this command, the compiled module will be placed in the site-packages directory of your Python installation, making it accessible to all Python scripts on your system.

This setup allows for a more standardized and manageable packaging and distribution of your C extension module with Python. Adjust the `setup.py` file according to your project's specific details and requirements.

## Conclusion

In this blog post, we've walked through the process of creating a CSV reader in C, integrated with Python using the CPython API. The reader is equipped with robust error handling to handle various scenarios, making it a reliable tool for working with CSV files.

Feel free to experiment with the code, and explore further improvements and optimizations based on your specific use cases. The complete source code is available on [GitHub](https://github.com/Joel-hanson/custom-csv-module).

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
