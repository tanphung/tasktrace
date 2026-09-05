# Mốc tiếp tục TaskTrace — 05/09/2026

Người dùng yêu cầu lưu commit và push GitHub, sau đó tạm dừng để ngày mai tiếp tục. Không tự triển khai Bradbury hoặc nộp bài trong bước sao lưu này.

## Dự án và phạm vi đã chốt

- Thư mục làm việc: `D:\app genlayer\TaskTrace` (đã đổi tên từ `New folder`).
- GitHub dự kiến: `tanphung/tasktrace`; xem remote `origin` để xác nhận.
- Track dự kiến: Future of Work. Chưa nộp portal, chưa được team chấp nhận.
- A trích xuất từ nguồn, B làm báo cáo từ A; phân biệt lỗi bắt nguồn ở A và lỗi mới ở B. B chỉ có trách nhiệm đối chiếu nguồn khi nghĩa vụ đó đã được chấp nhận trước.
- Nguồn là tài liệu tham chiếu được các bên thống nhất, không phải oracle xác nhận sự thật ngoài đời.
- Nguồn/A/B lưu toàn văn on-chain trong giới hạn byte. Không cắt phần đầu rồi bỏ phần cuối để review. Không để LLM quyết định số tiền, ví nhận hoặc thời hạn.
- Kế hoạch đầy đủ và bốn tài liệu bảo mật đã có trong `docs/`; `DESIGN-REVIEW.md` là tự rà soát thiết kế, không phải kiểm toán độc lập.

## Trạng thái đã có bằng chứng

1. Contract `contracts/tasktrace.py` đã qua lint ở phiên xây dựng; giữ runner hash hiện tại. Không sửa contract trong bước lưu GitHub.
2. 56 direct/adversarial tests đã pass; báo cáo `reports/direct-tests.xml`. LLM trong các test này là mock có kiểm soát, không được nói là 56 lần AI thực tế thành công.
3. Hai unit tests cho receipt decoder đã pass. Receipt của Studio chứa cả validator idle có ERROR; chỉ chọn đúng leader receipt, đồng thời yêu cầu lifecycle FINALIZED và execution thành công. Không đổi sang chấp nhận FINALIZED đơn thuần.
4. StudioNet chain `61999` đã deploy contract `0xebF38AD46a3C3D4728D84E0BF3EBD842Edab4802`, kiểm tra schema/config và hoàn thành create, accept A/B, submit A/B, request review cho case đầu.
5. Review thực tế đầu tiên thất bại `UNDETERMINED`. Final leader rollback: `[LLM_ERROR] Missing source/deliverable citation`. Đây là lỗi cần xử lý, không phải verdict thành công. Chưa có case live adjudication end-to-end pass.
6. Frontend hiện chỉ là bản đầu đọc dữ liệu thật. TypeScript/Vite build đã pass ở bước checkpoint; còn cảnh báo chunk lớn hơn 500 kB. Chưa có đủ wallet/forms, agent thực thi, trạng thái payout, component tests hoặc browser E2E. Vite/Vitest đã nâng bản vá, npm audit tại checkpoint báo 0 lỗ hổng đã biết; không tương đương kiểm toán bảo mật.
7. Chưa gửi giao dịch Bradbury. Chưa chứng minh payout tới ví nhận. Chưa deploy website công khai; Sites chỉ mới được đăng ký dự án.

Deploy tx: `0x8cf6c780629d4c08ee90fd279e477bdfa0010cb519d78ccfd83aa290353c371b`.

Failed review tx: `0x5884c07f6a95eb891e9f3857c420f5632ec2bcaf3548fbc3984fa51f512db0ec`.

Source SHA-256: `4606d0387360f0b4c0613a8188221def59225cdc0155e2b502af1b0dc2633f5c`.

## Thứ tự làm tiếp

1. Đọc `AGENTS.md`, README, tài liệu thiết kế và các skills GenLayer tương ứng; kiểm tra `git status` trước khi chỉnh sửa.
2. Đọc raw receipt lỗi và contract prompt/parser. Bổ sung hướng dẫn JSON/citation cụ thể hoặc cơ chế sửa output có giới hạn sau khi rà soát thiết kế. Tuyệt đối không bỏ yêu cầu dẫn chứng cả nguồn và sản phẩm, không bỏ validator độc lập, không chấp nhận lỗi thành verdict.
3. Thêm regression tests cho lỗi thực tế này; chạy lại GenVM lint, direct và adversarial tests. Giữ nguyên lịch sử lần chạy thất bại.
4. Nếu source thay đổi hoặc cần bộ ví mới, lưu toàn bộ `reports/studionet` cũ vào thư mục archive có tên/hash riêng đã kiểm tra đường dẫn, rồi khởi tạo lần chạy mới. Không ghi đè receipt cũ. Runner bảo vệ source hash, network, chain và ví để không vô tình dùng lại deployment sai. Không gửi lại giao dịch có trạng thái chưa rõ chỉ vì hết thời gian chờ.
5. Chạy ba ca cốt lõi thực tế (lỗi A, lỗi B, không lỗi), sau đó các ca còn lại và lặp có giới hạn. Mặc định runner chọn ba ca cốt lõi, một lượt; `TASKTRACE_REPETITIONS` chỉ nhận 1–3, `TASKTRACE_CASES` chọn ID trong fixtures. Lưu cả các lần thất bại, kiểm tra outcome và bảo toàn tiền. Runner hiện chưa kiểm chứng claim/payout.
6. Hoàn thiện luồng agent, wallet, tạo job, nhận việc/nộp artifact, yêu cầu review, dẫn chứng đầy đủ, timeout và claim. UI chỉ render state/receipt thật; MESSAGE_EMITTED không được hiện thành PAYMENT_CONFIRMED. Bổ sung frontend tests và E2E, kiểm tra desktop/mobile.
7. Sau khi tất cả gates đạt, báo kết quả cho người dùng và xin xác nhận triển khai Bradbury theo `AGENTS.md`. Khi có xác nhận mới kiểm tra chain/account/gas và deploy. Dùng tài khoản test/giới hạn tiền, kiểm tra cả transfer/child message trước khi khẳng định payout.
8. Hoàn thiện website công khai, README/submission, video/demo và bằng chứng test. Xác nhận GitHub đúng tài khoản liên kết portal, kiểm tra lại yêu cầu/hạn nộp hiện hành trước khi nộp. Không tự nhận dự án được chấp nhận hoặc chắc chắn đạt giải.

## Bí mật, tài khoản và hosting

- `.env` chứa ví đã được người dùng cấp; chỉ giữ tại máy. Không đọc ra log, chat, source, báo cáo, bundle hoặc GitHub.
- `.secrets/studionet.json` là các ví riêng cho StudioNet. File không được push; giữ thư mục gốc để tiếp tục run cũ. Clone repo không khôi phục được các khóa này.
- GitHub CLI đang đăng nhập `tanphung`; dùng keyring, không viết token vào remote URL.
- Sites project ID đã đăng ký: `appgprj_6a9c433f48d08191995a16cf0d13d0f4`, slug `tasktrace-work`. Cấu hình ở `.openai/hosting.json`; dùng lại project này, không tạo trùng. Chưa có live website. Token source-repository ngắn hạn không được lưu hoặc commit; lấy mới qua tool khi cần.
- Mỗi lần commit: kiểm tra staged files, chạy `npm run check:secrets`, rồi kiểm tra lại committed tree. Đây là guard hỗ trợ, vẫn phải review nội dung trước public push.

## Lệnh kiểm tra nhanh trên máy hiện tại

```powershell
Set-Location 'D:\app genlayer\TaskTrace'
git status --short
npm test
npm run build
npm audit
$env:GENVM_VERSION = 'v0.2.12'
.venv/Scripts/genvm-lint.exe check contracts/tasktrace.py --json
.venv/Scripts/python.exe -m pytest tests/direct tests/adversarial -q
```

Chỉ chạy `npm run test:integration` khi chủ động bắt đầu tiếp việc live StudioNet. Lệnh này có gửi giao dịch; không phải kiểm tra offline. Với manifest hiện tại, review đã terminal nên runner sẽ báo thất bại, không tự sửa được lỗi AI.

Người dùng chưa yêu cầu hẹn giờ tự chạy. Tiếp tục khi người dùng quay lại; không tạo automation hoặc tự chạy qua đêm.
