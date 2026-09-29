<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
    exit;
}

if (!empty($_POST['website'] ?? '')) {
    echo json_encode(['success' => true]);
    exit;
}

$rateLimitFile = sys_get_temp_dir() . '/san-studio-' . sha1($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$lastRequest = is_file($rateLimitFile) ? (int) file_get_contents($rateLimitFile) : 0;
if ($lastRequest > time() - 30) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Слишком много запросов']);
    exit;
}
file_put_contents($rateLimitFile, (string) time(), LOCK_EX);

$formType = trim((string) ($_POST['form_type'] ?? ''));
$name = trim((string) ($_POST['name'] ?? $_POST['order_name'] ?? $_POST['user_name'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? $_POST['order_phone'] ?? $_POST['user_phone'] ?? ''));

$name = preg_replace('/[\r\n]+/', ' ', $name) ?? '';
$phone = preg_replace('/[\r\n]+/', ' ', $phone) ?? '';

$nameLength = function_exists('mb_strlen') ? mb_strlen($name) : strlen($name);
if ($name === '' || $nameLength > 100 || $phone === '' || !preg_match('/\d{10,}/', preg_replace('/\D+/', '', $phone))) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Укажите корректные имя и телефон']);
    exit;
}

$labels = [
    'consultation' => 'Консультация',
    'package' => 'Заказ пакета',
    'quiz' => 'Квиз: расчёт стоимости'
];
$leadType = $labels[$formType] ?? '';
if ($leadType === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Неизвестный тип формы']);
    exit;
}

$package = trim((string) ($_POST['package'] ?? ''));
if ($formType === 'package' && !in_array($package, ['START', 'REGULAR', 'COMFORT', 'BUSINESS'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Не выбран пакет услуг']);
    exit;
}

$fieldLabels = [
    'objectType' => 'Тип объекта',
    'object_type' => 'Тип объекта',
    'area' => 'Площадь',
    'style' => 'Предпочитаемый стиль',
    'goal' => 'Что хочет получить клиент',
    'participation' => 'Готовность участвовать в реализации',
    'timeline' => 'Планируемый срок проекта',
    'package' => 'Выбранный пакет услуг'
];
$lines = [
    'Источник: форма «' . $leadType . '»',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
    'Дата: ' . date('Y-m-d H:i:s')
];

$skipFields = ['website', 'name', 'phone', 'order_name', 'order_phone', 'user_name', 'user_phone', 'agree', 'order_privacy_agree', 'privacy_agree', 'form_type'];
foreach ($_POST as $key => $value) {
    if (in_array($key, $skipFields, true) || is_array($value)) {
        continue;
    }

    $value = trim((string) $value);
    if ($value !== '') {
        $value = function_exists('mb_substr') ? mb_substr($value, 0, 1000, 'UTF-8') : substr($value, 0, 1000);
        $question = $fieldLabels[$key] ?? ucfirst(str_replace('_', ' ', $key));
        $lines[] = $question . ': ' . preg_replace('/[\r\n]+/', ' ', $value);
    }
}

$recipient = 'info@sanstudio.kz';
$subject = 'SAN STUDIO — ' . $leadType;
if ($formType === 'package') {
    $subject .= ': ' . $package;
}
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'From: info@sanstudio.kz',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: SAN STUDIO website'
];

$sent = mail($recipient, $encodedSubject, implode("\n", $lines), implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Почтовый сервер временно недоступен']);
    exit;
}

echo json_encode(['success' => true]);
