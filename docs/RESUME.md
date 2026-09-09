# Mốc tiếp tục TaskTrace — cập nhật 09/09/2026

## Mốc public cuối cùng — 09/09/2026

- Demo public đã xuất bản từ Sites version 1, gắn với commit đã test `7d8e5ab8ac799826d49d830846b580408e74fae5`: `https://tasktrace-work.tanphung6666.chatgpt.site/#job=bradbury-happy-a5bc7d15`.
- Đã kiểm tra lại trên production sau khi chuyển access sang `public`: không còn yêu cầu đăng nhập; job Bradbury tải ở trạng thái `RESOLVED`, bốn finding đều `SATISFIED`, và payout A hiển thị `Recipient transfer verified` với chênh lệch chính xác `+0.03 GEN`.
- GitHub `main` chứa toàn bộ source, test, raw evidence Bradbury và tài liệu bàn giao public; commit cuối phải qua secret guard trước khi push.
- Việc còn lại duy nhất không tự động hóa: người dùng kiểm tra hồ sơ, xác nhận GitHub liên kết portal, kết nối ví của mình, chấp nhận điều khoản và tự nộp bài.
- Các phần bên dưới được giữ làm lịch sử kỹ thuật. Khi thông tin mâu thuẫn, mốc public cuối cùng và báo cáo `docs/VERIFICATION-REPORT.md` là nguồn hiện hành.

## Mốc Bradbury đã xác minh — 09/09/2026

- Contract v1.1 đã deploy/finalized trên Bradbury tại `0x3FC5dce3abadf149111A45ae9936eBdD7A67AA88`; deploy tx `0xb98884870579ce28d933677f1fe1889f227c86c7b3c302c3c51aef9a1d7e44d2`. Source hash vẫn là `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`.
- Bradbury RPC chain ID là `4221`; `gl.message.chain_id`/evidence-domain do contract trả về là `1`. Frontend kiểm tra riêng hai miền này.
- Smoke job `bradbury-happy-a5bc7d15` đã `RESOLVED`, A/B đều `SATISFIED`; tất cả giao dịch thành công đã final. Resolve lần đầu `UNDETERMINED` được giữ nguyên; bounded retry lần một final thành công.
- Claim A `0x5887...6218` final thành công. Finalize EVM tx `0xa677...c9ff`, block `21205036`; balance ví A tăng chính xác `0.03 GEN`. Xem `reports/bradbury-release/`.
- Frontend đã trỏ Bradbury và chỉ mở write sau `submissionReady` gate. Toàn bộ gate, browser QA và Sites publication đã hoàn thành; người dùng tự kết nối portal wallet và tự nộp.

## Mốc release candidate v1.1 — 08/09/2026

Đây là mốc mới nhất và thay thế các số liệu cũ bên dưới khi có khác biệt.

- Contract StudioNet v1.1: `0x8128cD94346c94fe1FF20204d54a4B980Ae00b61`; source SHA-256 `a5bc7d153af669d5a03dc4e68e89ed88159ad0d265f17c2064a1f07733235391`. Schema và config đều đã xác minh.
- Rubric v1.1 định nghĩa coverage theo từng chủ đề được hỏi: phải trả lời rõ hoặc nói rõ là nguồn không xác định; chỉ nói “immediately” không tự động trả lời điều kiện approval/eligibility. Policy này được dùng chung trong leader prompt và validator grounding. Fixture timing-omission cũ được giữ nguyên để test, không sửa cho dễ pass.
- Ma trận thật trên StudioNet đạt **16/16 case**. Ba ca lõi a-fault, b-fault, no-fault đều đạt ba lần lặp liên tiếp; các ca timing-omission, both-fault, missing-data, source-duty, tail-injection và conflicting-source đều đạt. Manifest có **113/113 step `FINALIZED_SUCCESS`**: một deploy và bảy giao dịch cho mỗi case. Xem `reports/studionet-sep07probe/`.
- Full React/provider happy path đạt: job `work-69d379f8`, bảy giao dịch create → accept A/B → submit A/B → request review → resolve đều `FINALIZED_SUCCESS`; trạng thái cuối `RESOLVED`, A/B cùng `SATISFIED`. Xem `reports/frontend-live/`. Test dùng component/form thật và provider request thật với ví StudioNet cô lập; không phải chứng nhận MetaMask/Snap của người dùng.
- Gate local đạt ngày 08/09: GenVM lint 3/3 (chỉ cảnh báo có runner mới hơn; giữ pin đã review), 92 direct/adversarial tests, 64 frontend tests + 2 receipt tests, TypeScript test compile, production build, npm audit 0 lỗ hổng đã biết. Bundle còn cảnh báo 759.57 kB.
- Lỗi RPC thoáng qua trong polling được phục hồi bằng hash đã persist; runner không tự gửi lại transaction không chắc chắn. Toàn bộ failure v1.0 và run v1.1 cũ bị kẹt được giữ lại, không xóa để làm đẹp kết quả.
- Submission draft và logo 512×512 đã có trong `submission/`. Chưa public website, chưa deploy Bradbury, chưa xác minh external EOA child transfer và chưa nộp portal.
- Việc tiếp theo: review/commit/push release candidate; trình kết quả cho người dùng. Chỉ sau khi người dùng xác nhận rõ mới deploy Bradbury theo gate `AGENTS.md`. Sau Bradbury phải chạy smoke workflow và xác minh child transfer đến EOA trước khi ghi “payment verified”; rồi mới cấu hình frontend vào Bradbury, publish Sites, kiểm tra URL công khai và bàn giao bộ submission để người dùng tự nộp.

## Mốc mới nhất — đọc phần này trước lịch sử bên dưới

Người dùng đã yêu cầu tiếp tục xây dựng. Repo public đã có tại https://github.com/tanphung/tasktrace, baseline trước phiên này là `ca63b99`. Không còn ở trạng thái tạm dừng ngày 05/09.

- Contract sửa định dạng prompt và cho phép đúng một lần tạo lại output sai schema; không reroll verdict hợp lệ, không bỏ kiểm tra citation hay validator độc lập. Bốn tài liệu thiết kế đã có addendum trước sửa code.
- GenVM lint đạt; 81 direct/adversarial tests đạt (mock LLM). `npm test`: 50 frontend + 2 receipt tests đạt. TypeScript/Vite build đạt, còn cảnh báo bundle 755 kB.
- Studio contract hiện tại: `0x7df6bD92CEe3c7ABfD2CBc0c14B64f7dce8E7f72`, source SHA-256 `d7b95848879652f94acfedf5e384504cb49dfea836f33c533999470dba7856b0`. Frontend deployment config khớp địa chỉ này.
- Ba ca đầu `a-fault-1`, `b-fault-1`, `no-fault-1` đã FINALIZED, execution thành công, state RESOLVED và credits đúng. Xem manifest và `*.job.json` trong reports/studionet.
- Lần lặp `a-fault-2-d7b95848` thất bại UNDETERMINED sau 3 rotations; hash `0x0ef382211f5e821486fcdcec6050e1fe1d5a663510594dbb7ef83925aa7cc070`. Batch dừng tại đây, các lượt còn lại chưa chạy. KHÔNG được báo đạt stability gate.
- Công cụ read-only `node scripts/summarize-consensus.mjs reports/studionet/a-fault-2-d7b95848-resolve.receipt.json` giải mã candidate các vòng: vòng đầu A_COVERAGE/B_COVERAGE VIOLATED vì thiếu nội dung approval; các vòng sau SATISFIED vì diễn giải “immediately” hoặc bỏ sót topic approval. Đây là bằng chứng rubric/diễn giải chưa ổn định, không chứng minh được chính xác nhánh reject của từng validator.
- Hướng điều tra tiếp: làm rõ coverage và nghĩa vụ B đã chấp nhận, giữ ambiguity fixture như stress test; không đổi fixture để che thất bại. Nếu sửa contract, rà soát bốn tài liệu trước, thêm regression, deploy Studio mới và giữ toàn bộ lịch sử. Không nới xác minh để ép đồng thuận.
- Frontend có tạo job, role actions, evidence/citations toàn văn, deadline, credits, claim-warning, lưu hash chống gửi trùng, khôi phục hash không ký lại, và kiểm tra receipt + state trước báo thành công. Có WebMCP read-only và mở form không tự ký. Chưa có standalone worker agent.
- Browser đã kiểm tra live a-fault/b-fault, citation navigation, mobile 390px không tràn ngang, lỗi không có wallet và hai WebMCP tools. Chưa kiểm tra positive E2E bằng ví trình duyệt. Wallet event subscriptions còn cần bổ sung; mỗi write đã kiểm tra lại account/chain.
- Chưa gửi Bradbury, chưa xác minh recipient payout, chưa public website/nộp bài. Vẫn phải qua gate trong AGENTS và xin xác nhận sau khi người dùng xem kết quả.
- Lịch sử deployment lỗi ngày 05/09 được giữ tại `reports/archive/studionet-20260905-4606d038`.
- Lần đầu gửi a-fault-1 resolve gặp lỗi RPC `eth_gasPrice` trả HTML trước khi broadcast; kiểm tra SDK xác nhận bước này trước ký/gửi, sau đó mới thử lại. Không áp dụng cách này cho lỗi kết quả gửi không rõ.

## Lịch sử checkpoint 05/09 — thông tin dưới đây đã được thay thế khi khác phần trên

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
- Sites project ID: `appgprj_6a9c433f48d08191995a16cf0d13d0f4`, slug `tasktrace-work`. Cấu hình ở `.openai/hosting.json`; dùng lại project này, không tạo trùng. Website hiện đã public tại URL ghi ở mốc đầu tài liệu. Token source-repository ngắn hạn không được lưu hoặc commit; lấy mới qua tool khi cần.
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
