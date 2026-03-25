#!/bin/bash

# run with ./generate.sh <week_number>

if [ "$#" -ne 1 ]; then
    echo "Error: Exactly one argument is required."
    exit 1
fi

if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "Error: Argument should be a number."
    exit 1
fi

week_number="$1"
padded_number=$(printf "%02d" "$week_number")

chat_template="# 陳冠瑜

# 陳冠辰

# 王凱弘

# 孫怡臻"

report_template="# Week ${week_number}

## 目標

## 使用上課技術

## 使用額外技術

## 組員分工

* 陳冠瑜： 25%

* 陳冠辰： 25%

* 王凱弘： 25%

* 孫怡臻： 25%"

# Create $1_Chat.md file with content "Chat Content"
echo "$chat_template" > "Week${padded_number}_Chat.md"

# Create $1_Report.md file with content "Report Content"
echo "$report_template" > "Week${padded_number}_Report.md"