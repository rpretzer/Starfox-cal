#!/bin/bash

# This script generates Hive adapters for the model classes

echo "Generating Hive adapters..."
flutter pub run build_runner build --delete-conflicting-outputs

echo "Done!"
