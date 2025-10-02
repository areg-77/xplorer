#pragma once
#include <string>
#include <functional>

void WatchDirectory(const std::wstring& directory, std::function<void(const std::wstring&, const std::wstring&)> emit);
