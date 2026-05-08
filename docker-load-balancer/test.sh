#!/bin/bash

echo "=== Тестирование балансировки нагрузки ==="
echo ""

for i in {1..10}; do
    echo "Запрос #$i:"
    curl -s http://localhost/ | jq -r '.server'
    sleep 0.5
done

echo ""
echo "=== Проверка health-эндпоинта ==="
curl -s http://localhost/health | jq .

echo ""
echo "=== Проверка отказоустойчивости ==="
echo "Останавливаем backend-1..."
docker stop backend-1
sleep 2

for i in {1..5}; do
    echo "Запрос после остановки #$i:"
    curl -s http://localhost/ | jq -r '.server'
    sleep 0.5
done

echo ""
echo "=== Запускаем backend-1 обратно ==="
docker start backend-1
echo "Готово!"
