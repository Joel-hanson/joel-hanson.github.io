---
title: "Crafting Command-Line Magic with Ease"
date: 2023-12-24T11:23:15+05:30
draft: false
ShowToc: true
TocOpen: false
summary: "Different ways to accept arguments in a Bash script"
tags: ["BashScripting", "CommandLine", "bash", "script", "shell"]
categories: ["scripting"]
featureimage: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=2400&auto=format&fit=crop"
featureimagecaption: "Photo by [Jay Mantri](https://unsplash.com/@jaymantri) on [Unsplash](https://unsplash.com/photos/TFyi0xOs4X0)"
showHero: true
heroStyle: "background"
imagePosition: "center"
---

### Introduction

Ever wondered how to handle command-line arguments like a pro in your Bash scripts? Here are some nifty techniques to make your scripts more versatile:

#### 💡 **Positional Parameters:**

Access arguments directly using `$1`, `$2`, ..., `$n`. Simple and straightforward!

```bash
#!/usr/bin/env bash
echo "First argument: $1"
echo "Second argument: $2"
```

#### 🌀 **Special Variables (`$@`, `$*`):**

`$@` represents all parameters as separate words, while `$*` combines them into one. Flexibility at its best!

```bash
#!/usr/bin/env bash
for arg in "$@"; do
    echo "$arg"
done
```

#### 🔀 **Using `shift` to Shift Arguments:**

Shift positional parameters to the left, discarding the first one. Great for iterative processing!

```bash
#!/usr/bin/env bash
while [ "$#" -gt 0 ]; do
    echo "Argument: $1"
    shift
done
```

#### 🔍 **`getopts` for Option Parsing:**

Perfect for handling options and their arguments with finesse!

```bash
#!/usr/bin/env bash
while getopts ":a:b:" opt; do
    case $opt in
        a) arg_a="$OPTARG";;
        b) arg_b="$OPTARG";;
        \?) echo "Invalid option: -$OPTARG" >&2; exit 1;;
    esac
done
echo "Option a: $arg_a"
echo "Option b: $arg_b"
```

#### 🔄 **Using `shift` with `getopts`:**

Combine `shift` and `getopts` for advanced option handling and processing of remaining arguments.

```bash
#!/usr/bin/env bash
while getopts ":a:b:" opt; do
    case $opt in
        a) arg_a="$OPTARG";;
        b) arg_b="$OPTARG";;
        \?) echo "Invalid option: -$OPTARG" >&2; exit 1;;
    esac
done
shift $((OPTIND-1))
echo "Option a: $arg_a"
echo "Option b: $arg_b"
echo "Remaining arguments: $@"
```

#### 📝 **Read from Command Line:**

Use the `read` command to read input directly from the command line. Simple user interaction!

```bash
#!/usr/bin/env bash
echo -n "Enter your name: "
read name
echo "Hello, $name!"
```

----

### 🚀 **Example:**

Here's a production-ready and clean script to calculate square of a number.

📝 **Script: Calculate Square**

```bash
#!/usr/bin/env bash

############################################################
# Help Function: Display information about the script
############################################################
Help() {
   echo "Usage: $0 -n <number>"
   echo "Calculate the square of a number."
   echo
   echo "Options:"
   echo "-n    Specify the number for which to calculate the square."
   echo "-h    Display this help message."
   echo
   exit
}

############################################################
# Main Program Section: Placeholder for script logic
############################################################

# Set default value
Number=""

############################################################
# Process the input options. Add options as needed.
############################################################
while getopts ":hn:" option; do
   case $option in
      h) # display Help
         Help;;
      n) # Specify a number
         Number=$OPTARG;;
     \?) # Invalid option
         echo "Error: Invalid option"
         exit 1;;
   esac
done

############################################################
# Validate and perform the task
############################################################

# Check if the number is provided
if [ -z "$Number" ]; then
   echo "Error: Please provide a number using the -n option."
   exit 1
fi

# Check if the provided input is a valid number
if ! [[ "$Number" =~ ^[0-9]+$ ]]; then
   echo "Error: '$Number' is not a valid number."
   exit 1
fi

# Calculate the square
Square=$((Number * Number))

# Display the result
echo "The square of $Number is: $Square"

# Additional script logic goes here...
```

💡 **How to Use:**

- Run the script with `-n` to specify the number for calculating the square.
- Use `-h` to display the help message.

```bash
./square_calculator.sh -n 5
```

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
