---
title: "Online Machine Learning: Real-time Image Classification with CIFAR10 Dataset and Kafka"
date: 2024-10-02T18:12:07+05:30
draft: false
ShowToc: true
TocOpen: false
summary: "This blog post explores online machine learning through a practical example using the CIFAR10 dataset and Apache Kafka."
---

In this blog post, we'll explore the concept of online machine learning using a real-world example: classifying images from the CIFAR10 dataset in real-time using Apache Kafka for data streaming. We'll walk through the entire process, from training the initial model to setting up a streaming pipeline for continuous learning and prediction.

## What is Online Machine Learning?

Online machine learning is an approach where the model learns incrementally as new data becomes available, rather than training on a fixed dataset. This method is particularly useful for:

1. Handling large-scale datasets that don't fit in memory
2. Adapting to changing patterns in the data over time
3. Making predictions in real-time as new data arrives

Our example will demonstrate a simplified version of online learning, focusing on the real-time prediction aspect.

## Project Overview

Our project consists of three main components:

1. **Model Training**: We'll train a Convolutional Neural Network (CNN) on the CIFAR10 dataset.
2. **Data Producer**: A script that sends CIFAR10 images to a Kafka topic.
3. **Stream Processor**: A consumer that reads images from Kafka and makes real-time predictions.

Let's dive into each component.

## 1. Model Training

First, we'll train our CNN model on the CIFAR10 dataset. Here's a breakdown of the key parts of our `main.py` script:

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms

# ... (setup code omitted for brevity)

class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 64, 3, padding=1)
        self.fc1 = nn.Linear(64 * 4 * 4, 64)
        self.fc2 = nn.Linear(64, 10)

    def forward(self, x):
        # ... (forward pass implementation)

# ... (training loop and testing code)

if __name__ == "__main__":
    net = Net().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(net.parameters(), lr=LEARNING_RATE)
    
    train(device, trainloader, net, criterion, optimizer)
    testing(device, testloader, net)
```

This script defines a CNN architecture, trains it on the CIFAR10 dataset, and saves the trained model to a file. The model achieves decent accuracy on the test set, which we'll use for our online prediction system.

## 2. Data Producer

The `producer.py` script simulates a stream of incoming images by sending CIFAR10 images to a Kafka topic:

```python
from kafka import KafkaProducer
from torchvision.datasets import CIFAR10
from torchvision.transforms import Compose, Normalize, ToTensor

# ... (setup code omitted for brevity)

def send_image(image, label):
    image_bytes = image.numpy().tobytes()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    message = {"image": image_base64, "label": label.item(), "id": str(uuid4())}
    producer.send(TOPIC, json.dumps(message).encode("utf-8"))
    producer.flush()
    logger.info("Produced image")

if __name__ == "__main__":
    for i, data in enumerate(trainloader, 0):
        images, labels = data
        send_image(images[0], labels[0])
        time.sleep(5)  # Send messages with 5 second delay
```

This script loads the CIFAR10 dataset and sends each image to a Kafka topic, simulating a stream of incoming data.

## 3. Stream Processor (prediction)

The `consumer.py` script consumes images from the Kafka topic and makes real-time predictions:

```python
from kafka import KafkaConsumer
import torch
import torch.nn as nn

# ... (setup code omitted for brevity)

model = Net()
model.load_state_dict(torch.load(MODEL_PATH))
model.eval()

for message in consumer:
    data = json.loads(message.value.decode("utf-8"))
    image_bytes = base64.b64decode(data["image"])
    image = np.frombuffer(image_bytes, dtype=np.float32).reshape(3, 32, 32)
    image = torch.from_numpy(image)
    
    img_tensor = preprocess(image).unsqueeze(0)
    
    with torch.no_grad():
        output = model(img_tensor)
        _, predicted = torch.max(output, 1)
    
    logger.info(f"Classified as: {class_names[predicted.item()]}")
```

This script loads the pre-trained model, consumes images from the Kafka topic, and makes predictions in real-time.

## Running the Online Learning System

To run this online learning system:

1. Start your Kafka broker.
2. Run the `consumer.py` script to start the consumer and start doing prediction.
3. Run the `producer.py` script to start sending images to Kafka.

You'll see real-time predictions being made as images are consumed from the Kafka topic.

## Extending to True Online Learning

While our initial setup demonstrates real-time prediction, it doesn't update the model with new data. Let's extend this to true online learning by implementing the following steps:

1. Accumulate a batch of new images and their true labels.
2. Periodically retrain the model on this new data.
3. Update the model in the stream processor.

This would allow the model to adapt to new patterns in the data over time.

Here's how we can modify our `consumer.py` script to achieve this:

```python
import base64
import json
import logging
import sys
import types
from collections import deque
from threading import Thread
import time

import torch
import torch.nn as nn
import torch.optim as optim
from kafka import KafkaConsumer
from torchvision import transforms

# Assuming the Net class is defined as before
from main import Net

# ... (setup code omitted for brevity)

# Data accumulator
data_buffer = deque(maxlen=BATCH_SIZE)

def accumulate_data(image, label):
    """Accumulate new data for retraining"""
    data_buffer.append((image, label))

def retrain_model():
    """Retrain the model on accumulated data"""
    global model
    if len(data_buffer) < BATCH_SIZE:
        logger.info("Not enough data for retraining")
        return

    logger.info("Retraining model...")
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    model.train()
    for epoch in range(5):  # Do a few epochs of training
        running_loss = 0.0
        for i, (image, label) in enumerate(data_buffer):
            inputs = preprocess(image).unsqueeze(0)
            labels = torch.tensor([label])

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        logger.info(f"Epoch {epoch+1}, Loss: {running_loss/len(data_buffer):.3f}")

    model.eval()
    logger.info("Model updated")

    # Save the updated model
    torch.save(model.state_dict(), MODEL_PATH)

def update_model_periodically():
    """Periodically retrain the model"""
    while True:
        time.sleep(UPDATE_INTERVAL)
        retrain_model()

# Start a thread for periodic model updates
update_thread = Thread(target=update_model_periodically)
update_thread.daemon = True
update_thread.start()

# Main loop for processing incoming data
for message in consumer:
    # ... (message processing code)

    # Accumulate new data
    accumulate_data(image, label)

    # Make prediction
    # ... (prediction code)

    # Check prediction accuracy
    if predicted.item() == label:
        logger.info("Correct prediction!")
    else:
        logger.info("Incorrect prediction.")

    logger.info(f"Current buffer size: {len(data_buffer)}")
```

Let's break down the key components of this true online learning implementation:

### 1. Accumulating New Data

We use a `deque` with a fixed maximum length to store incoming images and their labels:

```python
data_buffer = deque(maxlen=BATCH_SIZE)

def accumulate_data(image, label):
    data_buffer.append((image, label))
```

This ensures we always have the most recent data for retraining.

### 2. Periodic Retraining

We implement a `retrain_model` function that performs a few epochs of training on the accumulated data:

```python
def retrain_model():
    # ... (function implementation)
```

This function is called periodically by a separate thread:

```python
def update_model_periodically():
    while True:
        time.sleep(UPDATE_INTERVAL)
        retrain_model()

update_thread = Thread(target=update_model_periodically)
update_thread.daemon = True
update_thread.start()
```

### 3. Updating the Model

After retraining, we update the global model and save it to disk:

```python
model.eval()
logger.info("Model updated")
torch.save(model.state_dict(), MODEL_PATH)
```

This ensures that future predictions use the most up-to-date model.

## Benefits of True Online Learning

This implementation of true online learning offers several advantages:

1. **Adaptability**: The model can adapt to changes in the data distribution over time.
2. **Continuous Improvement**: As more data is processed, the model's performance can potentially improve.
3. **Efficient Resource Use**: By training on batches of recent data, we avoid the need to store and retrain on the entire dataset.

## Considerations and Potential Improvements

While this implementation demonstrates the basics of online learning, there are several ways to enhance and optimize it:

1. **Validation**: Implement a separate validation set to monitor the model's performance over time.
2. **Adaptive Learning Rate**: Adjust the learning rate based on the model's performance or the amount of data processed.
3. **Concept Drift Detection**: Implement mechanisms to detect when the underlying data distribution changes significantly.
4. **Incremental Learning Algorithms**: Explore more sophisticated online learning algorithms designed for streaming data.
5. **Model Versioning**: Implement a system to track different versions of the model and potentially roll back if performance degrades.

## Conclusion

This project demonstrates the basics of setting up an online machine learning system using Kafka for data streaming and PyTorch for image classification. While our example focuses on real-time prediction, the same principles can be applied to create a fully online learning system that continuously updates and improves its model.

By extending our initial real-time prediction system to include true online learning capabilities, we've created a more dynamic and adaptive machine learning pipeline. This system can continuously improve its performance as it processes new data, making it well-suited for real-world applications where data patterns may change over time.

Remember that implementing online learning in production environments comes with its own set of challenges, including ensuring data quality, managing computational resources, and monitoring model performance. Always thoroughly test and validate your online learning system before deploying it in critical applications.

As you continue to explore online machine learning, consider diving deeper into topics like concept drift, incremental learning algorithms, and techniques for efficiently managing and updating models in distributed systems

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
