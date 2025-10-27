import React, { useState, useMemo, useRef } from "react";

// === Универсальные компоненты ===
const Section = ({ title, subtitle, children, right }) => (
  <section className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-xl font-semibold text-blue-800">{title}</h2>
        {subtitle && <p className="text-blue-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Chip = ({ children }) => (
  <span className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
    {children}
  </span>
);

const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
    className="w-full rounded-xl border border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none p-3 text-sm text-blue-900"
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 10 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full rounded-xl border border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none p-4 text-sm text-blue-900"
  />
);

const Button = ({ children, onClick, variant = "primary", disabled }) => {
  const styles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed",
    outline:
      "border border-blue-400 text-blue-700 hover:bg-blue-50 disabled:opacity-50",
    ghost: "text-blue-700 hover:bg-blue-100",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${styles[variant]}`}
    >
      {children}
    </button>
  );
};

const Tabs = ({ tabs, value, onChange }) => (
  <div className="flex flex-wrap items-center gap-2">
    {tabs.map((t) => (
      <button
        key={t.value}
        onClick={() => onChange(t.value)}
        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
          value === t.value
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
        }`}
      >
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const Stat = ({ label, value }) => (
  <div className="bg-white border border-blue-200 rounded-xl p-3 text-center">
    <div className="text-xs text-blue-500">{label}</div>
    <div className="text-xl font-semibold text-blue-800">{value}</div>
  </div>
);

// === Анализ текста ===
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countWords(tokens) {
  const map = new Map();
  tokens.forEach((t) => map.set(t, (map.get(t) || 0) + 1));
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function simpleSentiment(tokens) {
  const posList = [
    // 🇷🇺 Русские
    "хорошо", "отлично", "успех", "успешно", "улучшение", "прорыв",
    "выигрыш", "развитие", "рост", "достижение", "стабильность", "поддержка",
    "согласие", "мир", "позитив", "доверие", "радость", "улыбка", "помощь",
    "решено", "сильный", "спокойствие", "выгода", "результат", "надежно",
    "эффективно", "восстановление", "благополучие", "усилие", "возможность",
    "достижения", "развивается", "повышение", "поддержали",

    // 🇬🇧 English
    "good", "great", "excellent", "success", "successful", "positive",
    "improve", "growth", "progress", "benefit", "stable", "support", "peace",
    "trust", "smile", "achievement", "win", "profit", "strong", "safe", "hope",

    // 🇰🇿 Қазақша
    "жақсы", "керемет", "тамаша", "сәтті", "пайдалы", "өсу", "даму", "табыс",
    "жетістік", "сенім", "сабыр", "оң", "бекем", "қолдау", "үміт"
  ];

  const negList = [
    // 🇷🇺 Русские
    "плохо", "кризис", "провал", "ошибка", "потери", "спад", "убыток",
    "опасно", "угроза", "катастрофа", "разрушение", "снижение", "ослабление",
    "взрыв", "конфликт", "ненависть", "страх", "тревога", "негатив", "проблема",
    "обострение", "атака", "агрессия", "авария", "хаос", "срыв", "поражение",
    "нестабильность", "вред", "ущерб", "злость", "кризисный", "ухудшение",

    // 🇬🇧 English
    "bad", "worse", "worst", "fail", "failure", "loss", "threat", "risk",
    "crisis", "danger", "decline", "fall", "attack", "aggression", "hate",
    "problem", "negative", "unstable", "collapse", "conflict", "fear",
    "mistake", "error", "weak", "decrease", "damage",

    // 🇰🇿 Қазақша
    "жаман", "нашар", "зиян", "қауіп", "құлдырау", "қиын", "мін", "теріс",
    "шығын", "қауіпті", "проблема", "тәуекел", "агрессия", "төмендеу",
    "уайым", "қорқыныш", "дағдарыс", "төбелес", "дау", "зиянды"
  ];

  let pos = 0,
    neg = 0;
  tokens.forEach((t) => {
    if (posList.includes(t)) pos++;
    if (negList.includes(t)) neg++;
  });

  const score = pos - neg;
  return score > 1 ? "Позитив" : score < -1 ? "Негатив" : "Нейтраль";
}

// === Главный компонент ===
export default function App() {
  const [tab, setTab] = useState("analysis");

  // Анализ текста
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();

  const tokens = useMemo(() => tokenize(text), [text]);
  const topWords = useMemo(() => countWords(tokens).slice(0, 10), [tokens]);
  const sentiment = useMemo(() => simpleSentiment(tokens), [tokens]);

  // Тезаурус
  const [terms, setTerms] = useState([]);
  const [term, setTerm] = useState("");
  const [syn, setSyn] = useState("");

  // Интеграции соцсетей (демо)
  const [platform, setPlatform] = useState("twitter");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  function mockPosts() {
    const demo = Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      author: `user_${i}`,
      text: `Демо-пост #${i + 1} (${platform}): "${query || "военная аналитика"}"`,
      engagement: Math.floor(Math.random() * 400),
      date: new Date(Date.now() - i * 3600_000).toLocaleString(),
    }));
    return demo;
  }

  function fetchPosts() {
    setLoading(true);
    setTimeout(() => {
      setPosts(mockPosts());
      setLoading(false);
    }, 800);
  }

  // Паттерны
  const [patterns, setPatterns] = useState([]);
  function findPatterns() {
    const map = new Map();
    posts.forEach((p) =>
      tokenize(p.text).forEach((w) => map.set(w, (map.get(w) || 0) + 1))
    );
    const result = Array.from(map.entries())
      .filter(([_, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    setPatterns(result);
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-blue-700 text-white p-4 sticky top-0 shadow-md">
        <h1 className="text-lg font-semibold">InfoOps — Аналитическая платформа</h1>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <Tabs
          tabs={[
            { value: "analysis", label: "Анализ текста", icon: "📝" },
            { value: "social", label: "Интеграции соцсетей", icon: "🌐" },
            { value: "thesaurus", label: "Тезаурус", icon: "🧩" },
            { value: "patterns", label: "Паттерны", icon: "📈" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {/* === Анализ текста === */}
        {tab === "analysis" && (
          <Section title="Анализ текста" subtitle="Загрузите .txt или вставьте текст">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Textarea
                  value={text}
                  onChange={setText}
                  placeholder="Вставьте сюда текст..."
                  rows={14}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" onClick={() => fileRef.current.click()}>
                    📁 Загрузить
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = () => setText(reader.result);
                      reader.readAsText(file, "utf-8");
                    }}
                    className="hidden"
                  />
                  <Button variant="ghost" onClick={() => setText("")}>
                    🧹 Очистить
                  </Button>
                </div>
                {fileName && (
                  <p className="text-xs text-blue-600 mt-1">Файл: {fileName}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Слова" value={tokens.length} />
                  <Stat label="Уникальные" value={new Set(tokens).size} />
                  <Stat label="Тональность" value={sentiment} />
                </div>

                <div className="bg-white border border-blue-200 rounded-xl p-4">
                  <h3 className="text-blue-800 font-semibold mb-2 text-sm">
                    🔝 Топ-слова
                  </h3>
                  <ul className="text-sm text-blue-900 space-y-1">
                    {topWords.map(([w, c], i) => (
                      <li key={i}>
                        {i + 1}. {w} — {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* === Интеграции соцсетей === */}
        {tab === "social" && (
          <Section
            title="Интеграции соцсетей (демо)"
            subtitle="Демонстрация выборки публикаций по ключевым словам"
          >
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="rounded-xl border border-blue-300 p-3 text-sm"
              >
                <option value="twitter">Twitter/X</option>
                <option value="telegram">Telegram</option>
                <option value="facebook">Facebook</option>
              </select>
              <Input
                value={query}
                onChange={setQuery}
                placeholder="Введите запрос..."
              />
              <Button onClick={fetchPosts} disabled={loading}>
                {loading ? "Загрузка..." : "🔎 Получить посты"}
              </Button>
            </div>

            {posts.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="border border-blue-200 rounded-xl bg-white p-4"
                  >
                    <div className="flex justify-between text-sm text-blue-500">
                      <span>@{p.author}</span>
                      <Chip>{p.engagement} ❤</Chip>
                    </div>
                    <p className="text-blue-900 mt-2">{p.text}</p>
                    <p className="text-xs text-blue-400 mt-2">{p.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-blue-500">Нет данных. Запросите посты.</p>
            )}
          </Section>
        )}

        {tab === "thesaurus" && (
  <Section
    title="Тезаурус"
    subtitle="Добавляйте термины и синонимы или импортируйте готовую базу"
    right={
      <div className="flex gap-2">
        {/* Экспорт базы */}
        <Button
          variant="outline"
          onClick={() => {
            const blob = new Blob([JSON.stringify(terms, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "thesaurus.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          ⬇️ Экспорт JSON
        </Button>

        {/* Импорт базы */}
        <label className="border border-blue-300 rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-blue-50">
          ⬆️ Импорт JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const data = JSON.parse(reader.result);
                  if (Array.isArray(data)) setTerms(data);
                } catch {
                  alert("Ошибка при чтении файла");
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>
    }
  >
    {/* Форма добавления */}
    <div className="grid md:grid-cols-3 gap-4 mb-4">
      <Input value={term} onChange={setTerm} placeholder="Термин" />
      <Input value={syn} onChange={setSyn} placeholder="Синонимы" />
      <Button
        onClick={() => {
          if (!term.trim()) return;
          setTerms((p) => [...p, { term, syn }]);
          setTerm("");
          setSyn("");
        }}
      >
        ➕ Добавить
      </Button>
    </div>

    {/* Таблица терминов с удалением */}
    <div className="bg-white border border-blue-200 rounded-xl p-4">
      {terms.length === 0 ? (
        <p className="text-sm text-blue-500">Пока пусто</p>
      ) : (
        <table className="w-full text-sm text-blue-900">
          <thead>
            <tr className="text-left text-blue-500">
              <th>Термин</th>
              <th>Синонимы</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((t, i) => (
              <tr key={i} className="border-t border-blue-100">
                <td className="py-1">{t.term}</td>
                <td className="py-1">{t.syn}</td>
                <td className="py-1">
                  <Button
                    variant="danger"
                    onClick={() =>
                      setTerms((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    🗑️ Удалить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </Section>
)}

{/* === Паттерны (улучшенная версия) === */}
{tab === "patterns" && (
  <Section
    title="Паттерны"
    subtitle="Поиск часто повторяющихся слов и фраз в собранных постах"
  >
    {/* Кнопка анализа */}
    <Button
      onClick={findPatterns}
      disabled={posts.length === 0}
      variant="outline"
    >
      🚀 Найти паттерны
    </Button>

    {/* Если нет данных */}
    {posts.length === 0 ? (
      <p className="text-sm text-blue-500 mt-4">
        ⚠️ Нет данных для анализа. Сначала соберите посты во вкладке 🌐
        <b> «Интеграции соцсетей»</b>.
      </p>
    ) : (
      <>
        {/* Результаты анализа */}
        {patterns.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {patterns.map(([phrase, count], i) => (
              <div
                key={i}
                className="bg-white border border-blue-200 rounded-xl p-4 text-center"
              >
                <div className="text-blue-800 font-medium">{phrase}</div>
                <div className="text-sm text-blue-500">
                  Повторений: {count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-blue-500 mt-4">
            📊 После анализа здесь появятся самые часто встречающиеся слова и
            выражения.
          </p>
        )}
      </>
    )}
  </Section>
)}
      </main>

      <footer className="bg-blue-700 text-white text-center py-3 text-xs mt-6">
        InfoOps © 2025 — Демонстрационный интерфейс
      </footer>
    </div>
  );
}
