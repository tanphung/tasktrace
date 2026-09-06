# TaskTrace — Kế hoạch kiểm thử đối kháng v0.2

## Addendum v0.3 — regression của lỗi live 05/09

- R01: thiếu citation SOURCE/A/B ở từng obligation determinate phải bị parser từ chối, kể cả SATISFIED coverage.
- R02: output lần đầu thiếu citation, lần hai hợp lệ: đúng hai calls với cùng full snapshot; kết quả hợp lệ không bị thay status.
- R03: cả hai outputs lỗi: dừng đúng hai calls, review/ledger giữ nguyên; không mint credit hoặc trả UNASSESSABLE giả.
- R04: snapshot hash bị sửa: không gọi LLM, không retry.
- R05: valid first output: đúng một call; prompt skeleton không điền verdict sẵn và chứa đủ roles/chunks, kể cả optional B_SOURCE.
- R06: validator vẫn từ chối leader sai material outcome hoặc reason không được evidence hỗ trợ sau sửa prompt/retry.

Các test trên là regression có output kiểm soát, không thay thế ba ca live consensus và các lần lặp bắt buộc.

Tất cả case trong file này là yêu cầu chưa chạy. Không được báo “pass” khi mới viết test hoặc dùng mock cho hành vi consensus thực.

## Phân tầng

- GenVM lint: header/storage/decorators/API restrictions.
- Direct tests: state machine, permissions, arithmetic, timeout và ledger invariants.
- Reviewer unit tests: gọi riêng leader/validator helper với response kiểm soát; chứng minh validator từ chối kết luận sai.
- Integration: SDK/network/GenVM/immutable state/LLM/committee với bằng chứng thật phù hợp môi trường.
- Bradbury E2E: parent/child/external-message finality và tiền tới EOA; Studio không thay thế phép thử này.
- Frontend: renders actual state, wrong chain, rejected signature, duplicate clicks, reload/pending/error, anonymous website.

## Test cases bắt buộc

| ID | Case | Kỳ vọng |
| --- | --- | --- |
| S01 | A trích sai, B trung thực theo A | Chỉ A vi phạm |
| S02 | A đúng, B tự bỏ điều kiện | Chỉ B vi phạm |
| S03 | A/B vi phạm độc lập | Phạt mỗi bước theo khoản cố định |
| S04 | A/B đúng, client khiếu nại sai | Trả công và bond; không lỗi danh tiếng |
| S05 | Nguồn mâu thuẫn, rubric chưa giải quyết | UNASSESSABLE; không ép phạt |
| S06 | B có nghĩa vụ kiểm tra nguồn được ghi rõ | Đánh giá đúng nghĩa vụ này, không dùng mặc định cũ |
| E01 | Byte cuối artifact thay đổi | Hash fail |
| E02 | File quá giới hạn/UTF-8 lỗi/binary/archive | Reject trước semantic review |
| E03 | Sửa artifact đã chốt hoặc trỏ revision khác | Chỉ bản bất biến gốc hợp lệ |
| E04 | Issuer/chain/contract mismatch | Domain/role validation fail |
| E05 | RPC unavailable, snapshot thiếu hoặc chưa finalized | Không báo đã xác minh/kết thúc |
| E06 | Thiếu/trùng/đảo chunks | Fail complete review gate |
| E07 | Ngoại lệ chỉ ở chunk cuối | Kết luận vẫn phải xét ngoại lệ |
| E08 | Contradiction ở hai chunks | Không approve từ một chunk đơn lẻ |
| E09 | Sai source/chunk citation | Reject verdict |
| E10 | Artifact/review của job khác, upstream version sai | Reject replay |
| E11 | Thiếu/thừa/trùng obligation ID | Deterministic failure |
| E12 | Injection yêu cầu chấp nhận/thay recipient/giảm penalty | Không thay rule hoặc ledger |
| C01 | Leader đúng schema nhưng sai A/B | Validator từ chối |
| C02 | JSON malformed/unknown enums/type/range lỗi | Attempt controlled failure |
| C03 | LLM calls ngoài nondet hoặc storage writes trong callback | Lint/test không cho qua |
| C04 | Validator dùng leader-only thay snapshot contract và tự đánh giá | Test phải bắt được |
| C05 | LLM agreement thất bại nhiều vòng | Hiển thị đúng unavailable/undetermined; không giả success |
| M01 | Sai ví accept/submit/claim | Revert |
| M02 | Job chưa funded đủ hoặc nhận value sai | Revert/refund theo spec |
| M03 | Claim hai lần hoặc retry sau response mất | Không trả thêm |
| M04 | Refund và settlement đua nhau | Một nhánh hợp lệ, ledger bảo toàn |
| M05 | F/B/P cực trị, rounding/overflow | Không âm, không vượt tiền đã nhận |
| M06 | Không nộp A/B hoặc client im lặng | Deadline branch đúng; không khóa tiền vĩnh viễn |
| M07 | Parent finalized success nhưng message transfer thất bại | UI không báo đã nhận tiền; không tự retry gây double pay |
| M08 | Receipt của khoản khác/recipient khác/amount khác | Không dùng làm bằng chứng thanh toán |
| M09 | Provisional verdict bị thay bởi appeal | Không thực hiện effect không thể thu hồi trước finality |
| U01 | Wrong chain, signature reject, RPC timeout | Lỗi có cách phục hồi, không fake tx hash |
| U02 | Reload khi pending; nhấn hai lần | History còn, không vô tình submit lại |
| U03 | RPC đã accepted nhưng execution error | Giao diện báo thất bại |
| U04 | Không ví và mở website ẩn danh | Xem case đã verify được |
| U05 | Source/history/build bundle | Không chứa .env/private key/OAuth token |
| U06 | fresh clone + hướng dẫn | Cài, test và build được theo phiên bản pin |

## Mốc ra quyết định

G1: 8 fixtures cốt lõi; chạy thực ít nhất 3 lượt cho S01, S02, S04 với ghi lại thành công/thất bại. Mục tiêu tất cả case rõ ràng kết luận đúng trong retry bound, không tự loại kết quả thất bại khỏi báo cáo.

G2/G3: toàn bộ tests bắt buộc phù hợp lớp chạy pass, có coverage theo test ID; không dùng số lượng tests thay chất lượng.

G4: ba case on-chain A lỗi/B lỗi/không lỗi, tiền có receipt và execution đúng; negative evidence case không được phạt.

Bug P0/P1 về mất tiền, bypass signer/version provenance, sai material verdict rõ ràng hoặc fake UI success phải sửa trước public submission.
